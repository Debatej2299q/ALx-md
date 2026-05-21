import axios from 'axios'
import { getSetting } from '../settings.js'

export default {
    info: {
        name: 'weather',
        alias: ['w', 'climate'],
        desc: 'Get the current weather of a location'
    },
    execute: async (m, sock, args) => {
        const botName = getSetting('bot.name')
        const city = Array.isArray(args) ? args.join(' ') : args?.trim()

        if (!city) {
            return await sock.sendMessage(m.key.remoteJid, { text: `❌ Please provide a city name. Example: .weather New York` }, { quoted: m })
        }

        try {
            const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
            const current = res.data.current_condition[0]
            const area = res.data.nearest_area[0]

            let text = `
╭━━━〔 WEATHER INFO 〕━━━⬣
┃ ✦ Location : ${area.areaName[0].value}, ${area.country[0].value}
┃ ✦ Condition : ${current.weatherDesc[0].value}
┃ ✦ Temp : ${current.temp_C}°C / ${current.temp_F}°F
┃ ✦ Humidity : ${current.humidity}%
┃ ✦ Wind Speed : ${current.windspeedKmph} km/h
╰━━━━━━━━━━━━━━⬣

© 2026 ${botName}`

            await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m })
        } catch (e) {
            await sock.sendMessage(m.key.remoteJid, { text: `❌ Could not find weather details for "${city}".` }, { quoted: m })
        }
    }
}