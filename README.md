# ECO-ALLIANCE Bot

WhatsApp bot built with Baileys 7.0.0-rc.9

## Features

- **Dual Authentication**: QR code or pairing code
- **Dynamic Commands**: Hot-reload command system
- **Settings Management**: Runtime configuration updates
- **Private Mode**: Owner-only access control
- **Stability Focused**: Anti-spam protection

## Quick Start

```bash
# Install dependencies
npm install

# Configure bot
# Edit config.json - set owner number

# Start bot
npm start
```

## Configuration

Edit `config.json`:

```json
{
  "bot": {
    "prefix": ".",
    "auth": "pr"
  },
  "owner": {
    "number": "your_number_here"
  }
}
```

**Auth modes**: `pr` (pairing code) or `qr` (QR code)

## Commands

- `.alive` - Bot status
- `.ping` - Response time
- `.uptime` - Runtime duration
- `.settings` - Manage configuration
- `.auth` - Switch auth mode
- `.jid` - Get JID info
- `.gcjid` - Get group JID
- `.nowa` - Check numbers not on WhatsApp
- `.test` - Test command functionality

## Credits

- **[Baileys](https://github.com/WhiskeySockets/Baileys)**: WhatsApp Web API library
- **Founder**: [@debatej2299q](https://github.com/debatej2299q)
- **Co-Founder**: [@manjisama1](https://github.com/manjisama1)

## License

MIT