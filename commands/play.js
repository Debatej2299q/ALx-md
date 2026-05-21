import { Innertube } from 'youtubei.js'
import { getSetting } from '../settings.js'

// 💡 PASTE YOUR COPIED COOKIE HERE BETWEEN THE BACKTICKS
const YT_COOKIE = 'PASTE_YOUR_COOKIE_HERE'

async function streamToBuffer(stream) {
    const chunks = []
    for await (const chunk of stream) {
        chunks.push(chunk)
    }
    return Buffer.concat(chunks)
}

export default {
    info: {
        name: 'play',
        alias: ['song', 'music'],
        desc: 'Download high-quality audio directly from YouTube'
    },
    execute: async (m, sock, args) => {
        const botName = getSetting('bot.name')
        const query = Array.isArray(args) ? args.join(' ') : args?.trim()

        if (!query) {
            return await sock.sendMessage(m.key.remoteJid, { text: `❌ Please specify a song name or link.\nExample: .play static selecta` }, { quoted: m })
        }

        await sock.sendMessage(m.key.remoteJid, { text: `⏳ Connecting to YouTube and extracting audio...` }, { quoted: m })

        try {
            // Initialize Innertube using cookies to pass the login/age-gate check
            const yt = await Innertube.create({
                cookie: YT_COOKIE
            })
            
            let videoId

            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                const urlParts = query.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/)
                videoId = (urlParts[2] !== undefined) ? urlParts[2].split(/[^0-9a-z_-]/i)[0] : urlParts[0]
            } else {
                const search = await yt.search(query, { type: 'video' })
                if (!search.videos || search.videos.length === 0) {
                    return await sock.sendMessage(m.key.remoteJid, { text: `❌ No results found for "${query}"` }, { quoted: m })
                }
                videoId = search.videos[0].id
            }

            const videoInfo = await yt.getInfo(videoId)
            const title = videoInfo.basic_info.title
            const duration = videoInfo.basic_info.duration

            let textInfo = `
╭━━━〔 MUSIC TRACK 〕━━━⬣
┃ ✦ Title : ${title}
┃ ✦ Duration : ${duration}s
┃ ✦ Format : Audio (MP3)
╰━━━━━━━━━━━━━━⬣

🎵 Sending your audio track now...
© 2026 ${botName}`

            await sock.sendMessage(m.key.remoteJid, { text: textInfo }, { quoted: m })

            // Enforce strictly an audio download stream
            const downloadStream = await yt.download(videoId, {
                type: 'audio',
                quality: 'best'
            })

            const mediaBuffer = await streamToBuffer(downloadStream)

            await sock.sendMessage(m.key.remoteJid, { 
                audio: mediaBuffer, 
                mimetype: 'audio/mp4',
                ptt: false
            }, { quoted: m })

        } catch (e) {
            console.error(e)
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to bypass download block. Please double check your cookie configuration.` }, { quoted: m })
        }
    }
}
