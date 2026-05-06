import { commands } from '../index.js' 
import { getSetting } from '../settings.js' 

export default {
  info: {
    name: 'menu',
    alias: ['help', 'h'],
    desc: 'Main command list'
  },
  execute: async (m, sock) => {
    const prefix = getSetting('bot.prefix') 
    const botName = getSetting('bot.name') 
    const ownerName = getSetting('owner.name') 

    // Create unique list of commands (ignoring aliases)
    const uniqueCommands = Array.from(new Set(commands.values()))
    const totalCmds = uniqueCommands.length

    let menuText = `╔══════════════════╗\n`
    menuText += `║   ✨ *${botName}* ✨\n`
    menuText += `╠══════════════════╝\n`
    menuText += `┃ 👤 *Owner:* ${ownerName}\n`
    menuText += `┃ ⌨️ *Prefix:* [ ${prefix} ]\n`
    menuText += `┃ 📊 *Commands:* ${totalCmds}\n`
    menuText += `┃ 🕒 *Status:* Online\n`
    menuText += `╚═══════════════════\n\n`

    menuText += `💡 *COMMAND LIST* 💡\n`

    // Grouping logic (optional, but looks better)
    uniqueCommands.forEach((cmd) => {
      menuText += `┌──『 *${cmd.info.name.toUpperCase()}* 』\n`
      menuText += `│ ℹ️ ${cmd.info.desc || 'No description'}\n`
      if (cmd.info.alias.length > 0) {
        menuText += `│ 🖇️ _${cmd.info.alias.join(', ')}_\n`
      }
      menuText += `└───────────────┈\n`
    })

    menuText += `\n> © 2026 ${botName}`

    await sock.sendMessage(m.key.remoteJid, { 
      text: menuText,
      contextInfo: {
        externalAdReply: {
          title: `${botName} Assistant`,
          body: `Developed by ${ownerName}`,
          mediaType: 1,
          renderLargerThumbnail: true,
          // Using the group profile picture as you requested in your history
          thumbnailUrl: await sock.profilePictureUrl(m.key.remoteJid, 'image').catch(_ => null)
        }
      }
    }, { quoted: m }) 
  }
}