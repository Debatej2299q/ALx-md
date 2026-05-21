import { getSetting } from '../settings.js'

export default {
    info: {
        name: 'profile',
        alias: ['me', 'userinfo'],
        desc: 'Displays details and status of a user profile'
    },
    execute: async (m, sock) => {
        const botName = getSetting('bot.name')
        
        // Find targeted user (either a mentioned person or the sender themselves)
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.key.participant || m.key.remoteJid
        const cleanNumber = target.split('@')[0]

        try {
            // Fetch profile picture and text status securely
            let profilePic
            try {
                profilePic = await sock.profilePictureUrl(target, 'image')
            } catch {
                profilePic = 'https://pps.whatsapp.net/v/t61.24694-24/placeholder.jpg' // Fallback
            }

            let bioData
            try {
                bioData = await sock.fetchStatus(target)
            } catch {
                bioData = { status: 'No Bio status set' }
            }

            let text = `
╭━━━〔 USER PROFILE 〕━━━⬣
┃ ✦ User : @${cleanNumber}
┃ ✦ Bio : ${bioData.status}
┃ ✦ Platform : WhatsApp
╰━━━━━━━━━━━━━━⬣

© 2026 ${botName}`

            await sock.sendMessage(m.key.remoteJid, { 
                image: { url: profilePic },
                caption: text,
                mentions: [target]
            }, { quoted: m })

        } catch (e) {
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Could not extract profile analytics.` }, { quoted: m })
        }
    }
}