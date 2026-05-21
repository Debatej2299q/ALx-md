import { getSetting } from '../settings.js'

export default {
    info: {
        name: 'ship',
        alias: ['love', 'match'],
        desc: 'Calculate compatibility metrics between two group members'
    },
    execute: async (m, sock) => {
        const botName = getSetting('bot.name')
        
        // Ensure this command is run within a group context
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(m.key.remoteJid, { text: `❌ This command can only be used in group chats.` }, { quoted: m })
        }

        try {
            const groupMetadata = await sock.groupMetadata(m.key.remoteJid)
            const participants = groupMetadata.participants.map(p => p.id)

            // Pick two random participants
            const user1 = m.key.participant || participants[Math.floor(Math.random() * participants.length)]
            let user2 = participants[Math.floor(Math.random() * participants.length)]
            
            // Ensure we don't accidentally ship someone with themselves
            while (user1 === user2 && participants.length > 1) {
                user2 = participants[Math.floor(Math.random() * participants.length)]
            }

            // Create a deterministic score out of 100 based on their IDs combined
            const dynamicSeed = (user1 + user2).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
            const lovePercentage = (dynamicSeed % 101)

            let progressBars = '▓' * Math.floor(lovePercentage / 10)
            let text = `
╭━━━〔 HEART MATCH 〕━━━⬣
┃ ✦ Partner 1 : @${user1.split('@')[0]}
┃ ✦ Partner 2 : @${user2.split('@')[0]}
┃ ✦ Compatibility : ${lovePercentage}%
╰━━━━━━━━━━━━━━⬣

💖 Wish them a wonderful journey together!
© 2026 ${botName}`

            await sock.sendMessage(m.key.remoteJid, { 
                text, 
                mentions: [user1, user2] 
            }, { quoted: m })

        } catch (e) {
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Unable to process the match right now.` }, { quoted: m })
        }
    }
}