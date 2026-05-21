export default {
  info: {
    name: 'nowa',
    alias: ['wanumber'],
    desc: 'Check numbers not on WhatsApp'
  },
  execute: async (m, sock, text) => {
    if (!text) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: 'Send numbers to check\nExample: .nowa 919966923198\n8801770117777' 
      }, { quoted: m })
    }
    
    const numbers = text.split('\n').map(n => n.trim()).filter(n => /^\d{5,}$/.test(n))
    if (!numbers.length) {
      return sock.sendMessage(m.key.remoteJid, { text: 'No valid numbers found' }, { quoted: m })
    }
    
    const results = await Promise.all(numbers.map(async num => {
      try {
        const res = await sock.onWhatsApp(num + '@s.whatsapp.net')
        return { number: num, exists: res?.length > 0 }
      } catch {
        return { number: num, exists: false }
      }
    }))
    
    const notFound = results.filter(r => !r.exists).map(r => r.number)
    const reply = notFound.length === 0 
      ? 'All numbers are on WhatsApp' 
      : `Numbers without WhatsApp:\n${notFound.join('\n')}`
    
    await sock.sendMessage(m.key.remoteJid, { text: reply }, { quoted: m })
  }
}