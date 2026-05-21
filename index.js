import {
    useMultiFileAuthState,
    makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers,
    delay
} from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import qrcode from 'qrcode-terminal'
import { loadSettings, getSetting } from './settings.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
await loadSettings()

export let commands = new Map()
let botReady = false
let sock = null
let reconnectCount = 0

const loadCommands = async () => {
    commands.clear()
    console.log('🔄 Loading commands...')

    const files = readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'))

    for (const file of files) {
        try {
            const { default: cmd } = await import(`./commands/${file}?t=${Date.now()}`)
            if (cmd?.info?.name && cmd?.execute) {
                commands.set(cmd.info.name.toLowerCase(), cmd)
                if (Array.isArray(cmd.info.alias)) {
                    cmd.info.alias.forEach(a => commands.set(a.toLowerCase(), cmd))
                }
            }
        } catch (e) {
            console.error(`❌ Failed to load ${file}: ${e.message}`)
        }
    }

    console.log(`✅ Loaded ${commands.size} triggers: [${[...commands.keys()].join(', ')}]`)
}

const extractText = (m) => {
    const msg = m.message
    if (!msg) return ''

    const inner = msg.viewOnceMessage?.message || msg.viewOnceMessageV2?.message || msg
    const src = inner === msg ? msg : inner

    return (
        src.conversation ||
        src.extendedTextMessage?.text ||
        src.imageMessage?.caption ||
        src.videoMessage?.caption ||
        src.buttonsResponseMessage?.selectedDisplayText ||
        src.listResponseMessage?.title ||
        src.templateButtonReplyMessage?.selectedDisplayText ||
        ''
    ).trim()
}

const getMsgType = (m) => {
    const msg = m.message
    if (!msg) return 'unknown'
    const keys = Object.keys(msg)
    if (keys.includes('conversation') || keys.includes('extendedTextMessage')) return 'text'
    if (keys.includes('imageMessage')) return 'image'
    if (keys.includes('videoMessage')) return 'video'
    if (keys.includes('audioMessage')) return 'audio'
    if (keys.includes('stickerMessage')) return 'sticker'
    if (keys.includes('reactionMessage')) return 'reaction'
    if (keys.includes('pollCreationMessage') || keys.includes('pollUpdateMessage')) return 'poll'
    if (keys.includes('protocolMessage')) return 'protocol'
    if (keys.includes('ephemeralMessage')) return 'ephemeral'
    if (keys.includes('viewOnceMessage') || keys.includes('viewOnceMessageV2')) return 'viewonce'
    return keys[0] || 'other'
}

const normalizeJid = (jid = '') => {
    if (!jid) return ''
    const [user, server] = jid.split('@')
    const cleanUser = user.split(':')[0]
    return `${cleanUser}@${server}`
}

const toNumber = (jid = '') => jid.replace(/\D/g, '').replace(/^0+/, '')

const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const authMode = getSetting('bot.auth')

    const { version } = await fetchLatestBaileysVersion()
    console.log(`📡 WA version: ${version.join('.')}`)

    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: Browsers.ubuntu('Chrome'),
        markOnlineOnConnect: true,
        connectTimeoutMs: 60_000,
        retryRequestDelayMs: 2000,
        shouldIgnoreJid: jid =>
            jid === 'status@broadcast' ||
            jid?.endsWith('@broadcast') ||
            jid?.endsWith('@newsletter'),
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {

        if (qr) {
            if (authMode === 'qr') {
                console.log('📱 Scan QR:')
                qrcode.generate(qr, { small: true })
            } else if (authMode === 'pr') {
                try {
                    const ownerNum = getSetting('owner.number').replace(/\D/g, '')
                    console.log(`📲 Requesting pairing code for: ${ownerNum}`)
                    const code = await sock.requestPairingCode(ownerNum)
                    console.log(`\n🔑 PAIR CODE: ${code}\n`)
                    console.log('👆 WhatsApp > Linked Devices > Link with phone number')
                } catch (e) {
                    console.error('❌ Pairing code error:', e.message)
                }
            }
        }

        if (connection === 'connecting') {
            console.log('🔄 Connecting to WhatsApp...')
        }

        if (connection === 'open') {
            reconnectCount = 0
            const botNum = sock.user?.id?.split(':')[0] || '?'
            const botName = sock.user?.name || botNum
            const mode = getSetting('bot.privateMode') ? '🔒 PRIVATE' : '🌐 PUBLIC'
            console.log(`\n✅ Connected as ${botName} (${botNum})`)
            console.log(`   Mode   : ${mode}`)
            console.log(`   Prefix : "${getSetting('bot.prefix')}"`)
            console.log(`   Auth   : ${authMode.toUpperCase()}`)
            await delay(3000)
            botReady = true
            console.log('🎉 Bot is ready!\n')
        }

        if (connection === 'close') {
            botReady = false
            const err = new Boom(lastDisconnect?.error)
            const code = err?.output?.statusCode
            const reason = err?.output?.payload?.error || 'Unknown'
            console.log(`🔌 Disconnected — code: ${code} (${reason})`)

            switch (code) {
                case DisconnectReason.loggedOut:
                    console.log('🚫 Logged out. Delete the auth folder and restart.')
                    process.exit(1)
                    break

                case DisconnectReason.connectionReplaced:
                    console.log('⚠️  Session replaced by another device. Exiting.')
                    process.exit(1)
                    break

                case DisconnectReason.restartRequired:
                    console.log('🔄 Restart required...')
                    await delay(2000)
                    startBot()
                    break

                case DisconnectReason.timedOut:
                case DisconnectReason.connectionClosed:
                case DisconnectReason.connectionLost:
                default: {
                    reconnectCount++
                    const wait = Math.min(5000 * reconnectCount, 60_000)
                    console.log(`🔄 Reconnecting (attempt #${reconnectCount}) in ${wait / 1000}s...`)
                    await delay(wait)
                    startBot()
                    break
                }
            }
        }
    })

    sock.ev.on('messages.upsert', async ({ messages, type }) => {

        if (type !== 'notify') return

        const m = messages[0]
        if (!m?.message) return
        if (!botReady) return

        const msgType = getMsgType(m)
        if (!['text', 'image', 'video', 'viewonce'].includes(msgType)) return

        const text = extractText(m)
        const prefix = getSetting('bot.prefix')

        if (!text || !text.startsWith(prefix)) return

        const jid = m.key.remoteJid
        const isGroup = jid.endsWith('@g.us')
        const isSelf = m.key.fromMe

        const rawWho = isSelf
            ? (sock.user?.id || jid)
            : (m.key.participant || jid)

        const senderJid = normalizeJid(rawWho)
        const senderNum = toNumber(senderJid)
        const ownerNum = toNumber(getSetting('owner.number'))
        const isOwner = isSelf || senderNum === ownerNum

        const privateMode = getSetting('bot.privateMode')
        if (privateMode && !isOwner) return

        const parts = text.slice(prefix.length).trim().split(/ +/)
        const cmdName = parts.shift().toLowerCase()
        const args = parts

        console.log(`\n╔══ 📨 COMMAND ═══════════════════════`)
        console.log(`║  cmd     : ${cmdName}`)
        console.log(`║  args    : [${args.join(', ')}]`)
        console.log(`║  from    : ${senderJid}`)
        console.log(`║  chat    : ${isGroup ? 'Group' : 'DM'} (${jid})`)
        console.log(`║  self    : ${isSelf} | owner: ${isOwner} | private: ${privateMode}`)

        const command = commands.get(cmdName)
        if (!command) {
            console.log(`║  ❌ Unknown command: "${cmdName}"`)
            console.log(`╚══ Available: ${[...commands.keys()].join(', ')}`)
            return
        }

        if (command.info?.ownerOnly && !isOwner) {
            console.log(`║  🔒 Owner only — blocked for ${senderNum}`)
            console.log(`╚══`)
            await sock.sendMessage(jid, {
                text: '🔒 This command is restricted to the bot owner.',
                quoted: m
            })
            return
        }

        console.log(`╚══ 🚀 Executing...`)

        ;(async () => {
            try {
                await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } })

                const ctx = {
                    m,
                    sock,
                    args,
                    text: args.join(' '),
                    jid,
                    isGroup,
                    senderJid,
                    senderNum,
                    isOwner,
                    isSelf,
                    prefix,
                    cmdName,
                }

                await command.execute(m, sock, args, args.join(' '), ctx)
                await sock.sendMessage(jid, { react: { text: '✅', key: m.key } })
                console.log(`✔️  [${cmdName}] done`)
            } catch (e) {
                console.error(`💥 [${cmdName}] Error: ${e.message}`)
                console.error(e.stack)
                await sock.sendMessage(jid, { react: { text: '❌', key: m.key } })
            }
        })()
    })
}

loadCommands().then(() => startBot())
