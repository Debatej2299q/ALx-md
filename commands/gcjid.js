export default {
  info: {
    name: 'gcjid',
    alias: ['gjid'],
    desc: 'Get group JID'
  },
  execute: async (m, sock, text) => {
    if (text?.includes('chat.whatsapp.com')) {
      const code = text.split('chat.whatsapp.com/')[1]?.trim()
      if (!code) return sock.sendMessage(m.key.remoteJid, { text: 'Invalid link' }, { quoted: m })
      
      try {
        const info = await sock.groupGetInviteInfo(code)
        await sock.sendMessage(m.key.remoteJid, { 
          text: `Group: ${info.subject}\nJID: ${info.id}` 
        }, { quoted: m })
      } catch {
        await sock.sendMessage(m.key.remoteJid, { text: 'Invalid or expired link' }, { quoted: m })
      }
      return
    }
    
    if (m.key.remoteJid.endsWith('@g.us')) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `Group JID: ${m.key.remoteJid}` 
      }, { quoted: m })
    } else {
      await sock.sendMessage(m.key.remoteJid, { 
        text: 'Use in group or with group link' 
      }, { quoted: m })
    }
  }
}
