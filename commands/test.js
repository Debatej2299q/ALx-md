export default {
  info: {
    name: 'test',
    alias: ['t'],
    desc: 'Test command'
  },
  execute: async (m, sock, text) => {
    console.log('🧪 TEST COMMAND EXECUTED!')
    console.log('📝 Args received:', text)
    
    await sock.sendMessage(m.key.remoteJid, { 
      text: `Test successful! Args: ${text || 'none'}` 
    }, { quoted: m })
  }
}