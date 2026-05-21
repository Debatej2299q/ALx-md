import { commands } from '../index.js'
import { getSetting } from '../settings.js'

function runtime(seconds) {
    seconds = Number(seconds)
    const h = Math.floor(seconds / 3600)
    const m = Math.floor(seconds % 3600 / 60)
    const s = Math.floor(seconds % 60)
    return `${h}h ${m}m ${s}s`
}

export default {
    info: {
        name: 'menu',
        alias: ['help', 'h'],
        desc: 'Show all commands'
    },
    execute: async (m, sock) => {
        const prefix = getSetting('bot.prefix')
        const botName = getSetting('bot.name')
        const ownerName = getSetting('owner.name')

        const unique = Array.from(new Set(commands.values()))
        const date = new Date().toLocaleDateString('en-IN')
        const time = new Date().toLocaleTimeString('en-IN')

        let text = `
╭━━━〔 ${botName} 〕━━━⬣
┃ ✦ Owner : ${ownerName}
┃ ✦ Prefix : ${prefix}
┃ ✦ Commands : ${unique.length}
┃ ✦ Runtime : ${runtime(process.uptime())}
┃ ✦ Date : ${date}
┃ ✦ Time : ${time}
╰━━━━━━━━━━━━━━⬣

╭─❍ COMMAND LIST ❍─╮\n`

        unique.forEach(cmd => {
            text += `┃ ${prefix}${cmd.info.name}\n`
        })

        text += `╰━━━━━━━━━━━━━━⬣

> Type ${prefix}help <command> for details`

        await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m })
    }
}