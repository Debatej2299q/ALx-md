import { Innertube } from 'youtubei.js'
import { getSetting } from '../settings.js'

// 💡 PASTE YOUR COPIED COOKIE HERE BETWEEN THE BACKTICKS
const YT_COOKIE = `__Secure-3PSID=g.a0004QjjWQ5xsknbMNFlLyVbDQndHPSY7oOM02qT6hMEAbOkhj9_llPg2_xN2ywgfiAjakGeJAACgYKAQYSARISFQHGX2Mi29hSUmAMzlAJP1FndY1EUhoVAUF8yKr3ZrLyPYfb_SOy1PZVf0Hc0076;__Secure-1PSIDTS=sidts-CjUBflaCdVK5ayg_DbZNtiJG2nhxY5_t4mtp4M7PkX2CYxpGJV7JzyZGyPJyvu4fDrtRF2SFJBAA;SAPISID=YWaDmZmDpVp_DSvJ/AITRwzCCaBfC1P_PS;__Secure-1PSIDCC=AKEyXzWX_QOFAkpGkwitF1jkwnbVcsTAuHzFmgDLel6SS95Zy9SOKL5SSLp8Zu48tSRefXRKjw;SSID=A_EZ3rhIM2bzMqbu3;__Secure-1PAPISID=YWaDmZmDpVp_DSvJ/AITRwzCCaBfC1P_PS;__Secure-1PSID=g.a0004QjjWQ5xsknbMNFlLyVbDQndHPSY7oOM02qT6hMEAbOkhj9_XkImT_hgUI-SncPENJ0UnAACgYKAcMSARISFQHGX2Mi3hI4RVIuLrwz0-DY4VBfohoVAUF8yKriCQvara9vLToQAA20LXh00076;__Secure-3PAPISID=YWaDmZmDpVp_DSvJ/AITRwzCCaBfC1P_PS;__Secure-3PSIDCC=AKEyXzVDwp9htXbhTGGDMHjiC5P-7Xmh3rJDaSFTrPFoKM8-ibmlegQURjPoy8MuAOVajE3R;__Secure-3PSIDTS=sidts-CjUBflaCdVK5ayg_DbZNtiJG2nhxY5_t4mtp4M7PkX2CYxpGJV7JzyZGyPJyvu4fDrtRF2SFJBAA;LOGIN_INFO=AFmmF2swRgIhAIbHI3W7VsqQxo60c8tQMprWrmMUircaMHuA8IjMvtotAiEAw5ZCjgXEdGvDnXBIALeqLr4Wbzwg6spFMMYU5jZH2nM:QUQ3MjNmd2VMR0ptSkoyRXRzRmFHdGpmcEtldmItcVFwUWZfVzY2WlJsR0diQ1dCSFZfX0FxcU5QMjlxTXBZWHp4WWRLVVhGeFgwTDlLRHhtVUxwOHV4c1k5dXZ6cEx1WHg3TENfYThpbWFuUno2Y3ZwQy1qeTFUUjZQMFhaa2RfUXAyM2RGWEtUaEtvRDBTY01sMDYtVGpyQUxnWkwxamVn;PREF=f4=4000000&f6=40000000&tz=Asia.Calcutta&f7=100`

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