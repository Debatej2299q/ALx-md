import { getSetting } from '../settings.js'

export default {
    info: {
        name: 'calc',
        alias: ['calculate', 'math'],
        desc: 'Solve basic math equations directly'
    },
    execute: async (m, sock, args) => {
        const botName = getSetting('bot.name')
        const equation = Array.isArray(args) ? args.join(' ') : args?.trim()

        if (!equation) {
            return await sock.sendMessage(m.key.remoteJid, { text: `❌ Please provide a math equation.\nExample: .calc (50 * 2) / 4` }, { quoted: m })
        }

        try {
            // Sanitize input to only allow numbers and basic math operators for strict safety
            const sanitized = equation.replace(/[^0-9+\-*/().\s]/g, '')
            
            if (!sanitized) throw new Error("Invalid characters")

            // Evaluate expression safely
            const result = new Function(`return ${sanitized}`)()

            let text = `
╭━━━〔 🧮 CALCULATOR 〕━━━⬣
┃ ✦ Equation : ${equation}
┃ ✦ Result : *${result}*
╰━━━━━━━━━━━━━━⬣

© 2026 ${botName}`

            await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m })

        } catch (e) {
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid math format. Use simple operators (+, -, *, /).` }, { quoted: m })
        }
    }
}