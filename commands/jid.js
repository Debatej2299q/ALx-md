export default {
  info: {
    name: 'jid',
    alias: ['myjid'],
    desc: 'Get JID info'
  },
  execute: async (m, sock) => {
    const jid = m.key.participant || m.key.remoteJid
    
    await sock.sendMessage(m.key.remoteJid, { 
      text: `JID: ${jid}` 
    }, { quoted: m })
  }
}
