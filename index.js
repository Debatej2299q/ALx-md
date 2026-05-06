import { useMultiFileAuthState, fetchLatestBaileysVersion, makeWASocket, DisconnectReason, delay } from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import qrcode from 'qrcode-terminal'
import { loadSettings, getSetting } from './settings.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
await loadSettings()

export let commands = new Map()[cite: 3]
let botReady = false
let sock = null

const loadCommands = async () => {
    console.log('🔄 Loading commands...')
    const files = readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'))
    for (const file of files) {
        try {
            const { default: cmd } = await import(`./commands/${file}?t=${Date.now()}`)
            if (cmd?.info?.name && cmd?.execute) {
                commands.set(cmd.info.name.toLowerCase(), cmd)
                if (cmd.info.alias) cmd.info.alias.forEach(a => commands.set(a.toLowerCase(), cmd))
            }
        } catch (e) { console.error(`❌ Error in ${file}:`, e.message) }
    }
    console.log(`✅ Loaded ${commands.size} triggers.`)
}

// connection logic
const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        // REQUIRED: Use "Ubuntu" or "Chrome" as the first element for pairing
        browser: ["Ubuntu", "Chrome", "20.0.04"], 
        markOnlineOnConnect: true
    });

    // Pairing Logic
    if (getSetting('bot.auth') === 'pr' && !sock.authState.creds.registered) {
        // Clean the number to ensure only digits exist
        let owner = getSetting('owner.number').replace(/\D/g, '');
        
        // Delay ensures the socket is ready to request the code
        setTimeout(async () => {
            try {
                console.log(`🧪 Requesting pairing code for: ${owner}`);
                const code = await sock.requestPairingCode(owner);
                console.log(`🔑 YOUR PAIRING CODE: ${code}`);
            } catch (e) { 
                console.error('❌ Pairing Error:', e.message); 
            }
        }, 5000)
    }
    
    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr && getSetting('bot.auth') === 'qr') qrcode.generate(qr, { small: true })
        
        if (connection === 'open') {
            const botNumber = sock.user.id.split(':')[0]
            console.log(`✅ Connected as ${sock.user.name || botNumber}`)
            await delay(5000) 
            botReady = true
            console.log('🎉 Bot ready for commands!')
        }

        if (connection === 'close') {
            botReady = false
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) {
                console.log('🔄 Reconnecting...')
                startBot()
            }
        }
    })

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const m = messages[0];
        if (!botReady || !m.message) return;

        if (m.key.fromMe) return;

        const text = (m.message.conversation || 
                    m.message.extendedTextMessage?.text || 
                    m.message.imageMessage?.caption || 
                    m.message.videoMessage?.caption || '').trim();

        const prefix = getSetting('bot.prefix');
        if (!text.startsWith(prefix)) return;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const command = commands.get(cmdName);

        if (command) {
            const sender = (m.key.participant || m.key.remoteJid).split(':')[0].split('@')[0].replace(/\D/g, '');
            const owner = getSetting('owner.number').replace(/\D/g, '');
            const isOwner = sender === owner;

            if (getSetting('bot.privateMode') && !isOwner) return;

            (async () => {
                try {
                    await sock.sendMessage(m.key.remoteJid, { react: { text: '⏳', key: m.key } });
                    await command.execute(m, sock, args.join(' '));
                    await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
                } catch (e) {
                    console.error('Command Exec Error:', e.message)
                    await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
                }
            })();
        }
    });
}

loadCommands().then(() => startBot())
