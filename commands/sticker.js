import { Sticker, StickerTypes } from 'wa-sticker-formatter'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import { getSetting } from '../settings.js'

export default {
    info: {
        name: 'sticker',
        alias: ['s'],
        desc: 'Convert any image or short video/GIF into a clean WhatsApp sticker'
    },
    execute: async (m, sock) => {
        const botName = getSetting('bot.name') || 'ALx-MD'
        const ownerName = getSetting('owner.name') || 'DebaTej'

        // 1. Detect if the user sent an image/video or replied to one
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const msgType = m.message?.imageMessage || m.message?.videoMessage ? m.message : quotedMsg

        if (!msgType) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ Please reply to an *Image* or a short *Video/GIF* with your command to turn it into a sticker.` 
            }, { quoted: m })
        }

        // Get exact type identifiers
        const isImage = msgType.imageMessage || msgType.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
        const isVideo = msgType.videoMessage || msgType.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage

        await sock.sendMessage(m.key.remoteJid, { text: `⏳ Formatting your sticker...` }, { quoted: m })

        try {
            // 2. Extract media stream parameters dynamically from Baileys
            const targetMedia = isImage ? (msgType.imageMessage || msgType.extendedTextMessage.contextInfo.quotedMessage.imageMessage) 
                                        : (msgType.videoMessage || msgType.extendedTextMessage.contextInfo.quotedMessage.videoMessage)

            const streamType = isImage ? 'image' : 'video'
            
            // Download media contents safely into an array of streaming chunks
            const stream = await downloadContentFromMessage(targetMedia, streamType)
            let buffer = Buffer.from([])
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk])
            }

            // 3. Build and stamp metadata properties on the WebP canvas
            const stickerResult = new Sticker(buffer, {
                pack: botName,           // Pack Name visible when clicking the sticker
                author: ownerName,       // Author/Creator Name visible on click
                type: StickerTypes.FULL, // Fits the frame evenly without ugly cropping
                categories: ['🤩', '🎉'],
                id: m.key.id,
                quality: 60              // Balanced resolution optimization for low RAM environments
            })

            // Generate physical webp buffer array
            const stickerBuffer = await stickerResult.toBuffer()

            // 4. Dispatch the finished asset back into the chat
            await sock.sendMessage(m.key.remoteJid, { sticker: stickerBuffer }, { quoted: m })

        } catch (e) {
            console.error(e)
            await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ Failed to convert sticker. Ensure videos/GIFs are under 6 seconds long for KataBump hardware safety.` 
            }, { quoted: m })
        }
    }
}