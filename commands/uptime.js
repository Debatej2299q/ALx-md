export default {
  info: {
    name: 'uptime',
    alias: [],
    desc: 'Bot uptime'
  },
  execute: async (m, sock) => {
    const seconds = process.uptime()
    const h = Math.floor(seconds / 3600)
    const min = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    
    await sock.sendMessage(m.key.remoteJid, { 
      text: `Uptime: ${h}h ${min}m ${s}s` 
    }, { quoted: m })
  }
}