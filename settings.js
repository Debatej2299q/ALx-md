import { readFile } from 'fs/promises'

let settings = {}

export const loadSettings = async () => {
  try {
    const data = await readFile('./config.json', 'utf8')
    settings = JSON.parse(data)
    return settings
  } catch (e) {
    console.error('Failed to load settings:', e.message)
    process.exit(1)
  }
}

export const getSettings = () => settings

export const getSetting = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], settings)
}

export const updateSetting = (path, value) => {
  const keys = path.split('.')
  const lastKey = keys.pop()
  const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, settings)
  target[lastKey] = value
}

export default {
  load: loadSettings,
  get: getSettings,
  getSetting,
  updateSetting
}