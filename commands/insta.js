import { igdl } from 'ruhend-scraper'
import { getSetting } from '../settings.js'

export default {
    info: {
        name: 'ig',
        alias: ['instagram', 'insta'],
        desc: 'Download videos/reels/photos from Instagram'
    },
    execute: async (m, sock, args) => {
        const botName = getSetting('bot.name')
        const url = Array.isArray(args) ? args[0] : args?.trim()

        if (!url || !url.includes('instagram.com')) {
            return await sock.sendMessage(m.key.remoteJid, { text: `❌ Please provide a valid Instagram URL.` }, { quoted: m })
        }

        await sock.sendMessage(m.key.remoteJid, { text: `⏳ Fetching media from Instagram...` }, { quoted: m })

        try {
            // Using the correct function export from ruhend-scraper
            const res = await igdl(url)
            
            if (!res || res.length === 0) {
                throw new Error("No media found.")
            }

            // Loop and send all media found (handles single items or carousel albums)
            for (let mediaUrl of res) {
                // If the link contains .mp4 or dynamic parameters indicating a video, send as video
                const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('video')

                if (isVideo) {
                    await sock.sendMessage(m.key.remoteJid, { 
                        video: { url: mediaUrl }, 
                        caption: `✨ Successfully fetched by ${botName}` 
                    }, { quoted: m })
                } else {
                    await sock.sendMessage(m.key.remoteJid, { 
                        image: { url: mediaUrl }, 
                        caption: `✨ Successfully fetched by ${botName}` 
                    }, { quoted: m })
                }
            }

        } catch (e) {
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to download. Make sure the account is public and the link is accurate.` }, { quoted: m })
        }
    }
}