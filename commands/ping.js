export default {
  info: {
    name: 'ping',
    alias: [],
    desc: 'Response time check'
  },
  execute: async (m, sock) => {
    const start = Date.now()
    const msg = await sock.sendMessage(m.key.remoteJid, { 
      text: 'Pinging...' 
    }, { quoted: m })
    
    const ping = Date.now() - start
    await sock.sendMessage(m.key.remoteJid, { 
      text: `Pong! ${ping}ms`,
      edit: msg.key
    })
  }
}