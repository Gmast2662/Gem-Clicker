# 💎 Gem Clicker - Idle Mining Game

A fully customizable idle/incremental clicker game built with vanilla JavaScript. Click to mine gems, upgrade your tools, and build an automated gem mining empire!

## 🎮 Features

- **Addictive Mining Gameplay** - Click the gem to mine and earn currency
- **Multiple Upgrade Types** - Mining tool upgrades and automatic generators
- **Prestige System** - Reset for permanent bonuses and long-term progression
- **Achievement System** - Unlock achievements as you progress
- **Auto-Save** - Your progress is automatically saved
- **Offline Progress** - Earn gems even when you're away
- **Beautiful Modern UI** - Sleek gem-themed design with smooth animations
- **Fully Customizable** - Every aspect configurable through JSON

## 🚀 Getting Started

### Quick Start

1. Simply open `index.html` in your web browser
2. Start clicking the gem to mine!
3. Purchase tool upgrades to increase your mining power
4. Buy generators to mine gems automatically
5. Prestige when ready for permanent bonuses

### Admin Panel Access

**No Console Needed!**

1. Click the **🔧 Admin** button (bottom-right corner)
2. Enter password: **`Admin123`**
3. Access all admin controls!

**Admin Features:**
- Add gems (quick buttons or custom amount)
- Set generator/upgrade levels
- Unlock all achievements/shop/cosmetics
- Trigger lucky events
- Set prestige/rebirth points

### File Structure

```
idle-clicker-game/
├── index.html                  # Main game file
├── styles.css                  # All styling
├── game.js                    # Game logic
├── config.json                # Game configuration (customize here!)
├── tips.json                  # Game tips (editable)
├── changelog.json             # Patch notes (editable)
├── version.json               # Version tracking
├── manifest.json              # PWA manifest
├── service-worker.js          # PWA offline support
├── favicon.svg                # Game icon
├── sound-tester.html          # Sound testing tool
├── sounds/                    # Audio files folder
│   ├── arcade click.mp3
│   ├── arcade buy.mp3
│   └── arcade achievement.mp3
├── README.md                  # Player documentation
├── SETUP.md                   # Developer guide (this file)
├── TODO.md                    # Feature tracking
├── COSMETICS_GUIDE.md         # Adding cosmetics
├── EDITING_GUIDE.md           # Editing tips/changelog
├── SOUND_GUIDE.md             # Custom sounds guide
└── HOW_TO_UPDATE_VERSION.md   # Version updating guide
```

## ⚙️ Customization Guide

All game content is configured in `config.json`. You can easily customize every aspect of the game!

### Game Settings

```json
"game": {
  "title": "Your Game Title",
  "currency": "Your Currency Name",
  "currencyIcon": "🎮",
  "clickable": "Thing to Click",
  "clickableIcon": "🎯",
  "startingCurrency": 0,
  "clickPower": 1,
  "saveInterval": 5000
}
```

- `title`: The name displayed at the top of the game
- `currency`: Name of your in-game currency
- `currencyIcon`: Emoji/symbol for your currency
- `clickable`: Name of the object players click
- `clickableIcon`: Emoji/symbol for the clickable object
- `startingCurrency`: Amount of currency new players start with
- `clickPower`: Base clicking power (how much currency per click)
- `saveInterval`: Auto-save frequency in milliseconds

### Click Upgrades

Click upgrades increase the amount earned per click:

```json
{
  "id": "unique_id",
  "name": "Upgrade Name",
  "description": "What this upgrade does",
  "icon": "👆",
  "baseCost": 10,
  "costMultiplier": 1.15,
  "powerIncrease": 1,
  "maxLevel": null
}
```

- `id`: Unique identifier (must be unique!)
- `name`: Display name
- `description`: Short description
- `icon`: Emoji/symbol to display
- `baseCost`: Initial cost
- `costMultiplier`: How much the cost increases per level (1.15 = 15% increase)
- `powerIncrease`: How much clicking power each level adds
- `maxLevel`: Maximum level (null = unlimited)

### Generators

Generators automatically produce currency over time:

```json
{
  "id": "generator_id",
  "name": "Generator Name",
  "description": "What this generator does",
  "icon": "🏭",
  "baseCost": 100,
  "costMultiplier": 1.15,
  "baseProduction": 1,
  "maxLevel": null
}
```

- `baseProduction`: Currency generated per second per level
- All other fields work the same as click upgrades

**Balancing Tips:**
- Each generator should be ~10x more expensive than the previous
- Production should also scale significantly (5-10x increases)
- Cost multiplier between 1.10-1.20 works well

### Prestige System

Configure the prestige/rebirth system:

```json
"prestige": {
  "enabled": true,
  "currencyName": "Prestige Points",
  "currencyIcon": "⭐",
  "requirement": 1000000,
  "formula": "sqrt",
  "divisor": 1000000,
  "bonusPerPoint": 0.01,
  "confirmationRequired": true
}
```

- `enabled`: Turn prestige on/off
- `currencyName`: Name of prestige currency
- `currencyIcon`: Symbol for prestige currency
- `requirement`: Minimum total earned to prestige
- `formula`: "sqrt" or "log" - how prestige points are calculated
- `divisor`: Value to divide total earned by before applying formula
- `bonusPerPoint`: Multiplier bonus per prestige point (0.01 = 1% per point)
- `confirmationRequired`: Ask for confirmation before prestiging

**Prestige Formula Examples:**
- `sqrt` with divisor 1000000: √(1000000/1000000) = 1 point at 1M total earned
- `sqrt` with divisor 100000: √(1000000/100000) = 3.16 → 3 points at 1M total earned

### Achievements

Add achievements to reward players:

```json
{
  "id": "achievement_id",
  "name": "Achievement Name",
  "description": "How to unlock this",
  "icon": "🏆",
  "requirement": {
    "type": "total_clicks",
    "value": 100
  }
}
```

**Requirement Types:**
- `total_clicks`: Total number of clicks
- `total_earned`: Total currency earned (lifetime)
- `currency`: Current currency amount
- `generator_owned`: Specific generator level (needs `id` field)

### UI Customization

Change colors and visual settings:

```json
"ui": {
  "theme": {
    "primary": "#ff6b6b",
    "secondary": "#4ecdc4",
    "background": "#1a1a2e",
    "cardBackground": "#16213e",
    "text": "#eaeaea"
  },
  "animations": {
    "clickAnimation": true,
    "floatingNumbers": true,
    "particleEffects": true
  },
  "numberFormat": {
    "useShortFormat": true,
    "decimalPlaces": 2
  }
}
```

- Change any hex color codes to customize the look
- Toggle animations on/off
- Configure number formatting

## 🎯 Game Mechanics

### Currency Generation

- **Clicking**: Earn currency by clicking the main button
- **Generators**: Purchase generators for passive income
- **Prestige Bonus**: Multiplies both clicking and generation

### Progression Tips

1. **Early Game**: Focus on clicking upgrades
2. **Mid Game**: Start buying generators for passive income
3. **Late Game**: Balance generators and click upgrades
4. **Prestige**: Reset when you can gain significant prestige points

### Prestige Strategy

- Your first prestige gives the biggest relative boost
- Each prestige point gives a permanent +1% bonus (configurable)
- Prestige when gains slow down significantly

## 💾 Save System

### Features
- **Auto-Save**: Game saves automatically every 5 seconds (configurable)
- **Manual Save**: Click the save button anytime
- **Offline Progress**: Earn currency while away (up to 24 hours)
- **Export/Import**: Transfer saves between devices

### Using Export/Import

1. Click "Export" to copy save data to clipboard
2. Paste and save the text somewhere safe
3. Click "Import" on another device/browser
4. Paste the save data and confirm

### Reset Progress

Click the "Reset" button to completely wipe all progress. This cannot be undone!

## 🎨 Creating Your Own Theme

Want to make a completely different game? Just edit `config.json`!

### Example Themes

**Gem Clicker (Current):**
```json
"game": {
  "title": "Gem Clicker",
  "currency": "Gems",
  "currencyIcon": "💎",
  "clickable": "Gem",
  "clickableIcon": "💎"
}
```

**Space Empire:**
```json
"game": {
  "title": "Space Empire",
  "currency": "Stars",
  "currencyIcon": "⭐",
  "clickable": "Planet",
  "clickableIcon": "🪐"
}
```

**Money Clicker:**
```json
"game": {
  "title": "Money Empire",
  "currency": "Dollars",
  "currencyIcon": "💵",
  "clickable": "Money",
  "clickableIcon": "💰"
}
```

## 🔧 Advanced Customization

### Adding More Generators

To add new generators, simply add objects to the `generators` array:

```json
{
  "id": "custom_generator",
  "name": "Custom Generator",
  "description": "Your description",
  "icon": "🎯",
  "baseCost": 50000,
  "costMultiplier": 1.15,
  "baseProduction": 200,
  "maxLevel": null
}
```

### Balancing Your Game

**Cost Progression:**
- Starter items: 10-100
- Early game: 100-10,000
- Mid game: 10,000-1,000,000
- Late game: 1,000,000+

**Production Scaling:**
- Each tier should produce 5-10x more than previous
- Balance production with cost increases

**Prestige Timing:**
- Set requirement so prestige happens after 30-60 minutes
- Adjust divisor to control prestige point gain rate

### Number Formatting

Numbers automatically format with suffixes:
- 1,000 → 1K
- 1,000,000 → 1M
- 1,000,000,000 → 1B

Supports: K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc

## 🐛 Troubleshooting

**Game won't load:**
- Make sure all files are in the same folder
- Check browser console for errors
- Ensure `config.json` is valid JSON (use a JSON validator)

**Save not working:**
- Check if browser allows localStorage
- Try a different browser
- Check if in private/incognito mode

**Numbers showing as NaN:**
- Check that all numeric values in config.json are numbers, not strings
- Ensure no division by zero

**Config changes not appearing:**
- Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache
- Make sure config.json is saved properly

## 📱 Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

**Requirements:**
- JavaScript enabled
- LocalStorage enabled
- Modern browser (2020+)

## 🎓 Learning Resources

Want to modify the code further?

**Files to edit:**
- `config.json` - All game content (easiest!)
- `styles.css` - Visual appearance
- `game.js` - Game mechanics (advanced)
- `index.html` - Page structure (advanced)

**Tips:**
- Start by only editing `config.json`
- Test changes frequently
- Keep backups of working versions
- Use browser dev tools (F12) to debug

## 🎨 Adding Cosmetics

Want to add custom themes, gem skins, or particle effects?

**See COSMETICS_GUIDE.md for complete instructions!**

### Quick Cosmetics Overview

**Structure in config.json:**
```json
"cosmetics": {
  "themes": [...],    // Color schemes for entire UI
  "skins": [...],     // Gem appearance changes
  "particles": [...]  // Click particle effects
}
```

**To add a new cosmetic:**
1. Add item to appropriate array in `config.json`
2. Add CSS styling in `styles.css` (for themes/skins)
3. Add color arrays in `game.js` (for particles)
4. Test in-game!

**Required fields for all cosmetics:**
- `id` - Unique identifier
- `name` - Display name
- `description` - What it does
- `icon` - Emoji icon
- `cost` - Price in gems
- `purchased` - Always `false` initially
- `value` - CSS class name or effect identifier

**Admin Testing:**
1. Click **🔧 Admin** button → Password: `Admin123`
2. Cosmetics section → Click **Unlock All**
3. Go to Settings → Select your cosmetics!

**Full Guide:** See `COSMETICS_GUIDE.md` for step-by-step examples

## 📝 License

This is a free, open-source game template. Feel free to:
- Modify it however you want
- Use it for personal or commercial projects
- Share it with others
- Create your own versions

No attribution required, but always appreciated!

## 🎉 Credits

Created as a fully customizable idle clicker game template.

**Built with:**
- Vanilla JavaScript
- CSS3
- HTML5
- Pure awesomeness

---

## 🚀 Quick Customization Checklist

Ready to make it yours? Follow these steps:

- [ ] Change game title in `config.json`
- [ ] Update currency name and icon
- [ ] Modify clickable object name and icon
- [ ] Customize generator names and descriptions
- [ ] Adjust upgrade names and descriptions
- [ ] Set your preferred color scheme
- [ ] Balance costs and production rates
- [ ] Add custom achievements
- [ ] Configure prestige settings
- [ ] Test and enjoy!

**Have fun creating your incremental game!** 🎮✨

