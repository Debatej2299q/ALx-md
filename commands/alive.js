export default {
  info: {
    name: 'alive',
    alias: [],
    desc: 'Bot status check'
  },
  execute: async (m, sock) => {
    await sock.sendMessage(m.key.remoteJid, { 
      text: 'Bot is running' 
    }, { quoted: m })
  }
}
