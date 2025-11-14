# 🎵 Custom Sound Guide

Complete guide for adding and customizing sounds in your game!

---

## 📋 **Table of Contents**

1. [Quick Reference](#quick-reference)
2. [Method 1: Oscillator Sounds (Simple)](#method-1-oscillator-sounds-simple)
3. [Method 2: Audio Files (Advanced)](#method-2-audio-files-advanced)
4. [Sound Parameters](#sound-parameters)
5. [Examples](#examples)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 **Quick Reference**

### **Current Sound Packs:**
- 🎵 Default - Smooth sine waves
- 🎮 Retro - 8-bit square waves
- 🔔 Soft - Gentle triangle waves
- ⚔️ Epic - Powerful sawtooth waves
- 🌿 Nature - Calming natural tones

### **Sound Types:**
- `click` - When clicking the gem
- `buy` - When purchasing upgrades/generators
- `achievement` - When unlocking achievements

---

## ⚡ **METHOD 1: Oscillator Sounds (Simple)**

Use Web Audio API oscillators - no audio files needed!

### **Step 1: Add to `config.json`**

Find the `"sounds"` array (around line 451) and add:

```json
{
  "id": "sound_pack_cosmic",
  "name": "Cosmic Sound Pack",
  "description": "Space-themed electronic sounds",
  "icon": "🌌",
  "cost": 950000,
  "purchased": false,
  "value": "cosmic"
}
```

**Fields:**
- `id` - Unique identifier (must match what you use in game.js)
- `name` - Display name in the shop
- `description` - What it sounds like
- `icon` - Emoji icon
- `cost` - Price in gems
- `purchased` - Always `false` initially
- `value` - Short name used in code (e.g., "cosmic")

### **Step 2: Add to `game.js`**

Find the `soundLibrary` object (around line 139) and add your pack:

```javascript
cosmic: {
    click: { frequency: 1100, volume: 0.13, duration: 0.08, waveType: 'sine' },
    buy: { frequency: 550, volume: 0.17, duration: 0.18, waveType: 'triangle' },
    achievement: { frequency: 1320, volume: 0.23, duration: 0.35, waveType: 'sawtooth' }
},
```

**That's it!** Your new sound pack will appear in the Cosmetics shop!

---

## 🎵 **Sound Parameters Explained**

### **Frequency (Hz)**

Controls the **pitch** of the sound:

| Range | Description | Examples |
|-------|-------------|----------|
| 200-400 | Very low, deep | Bass sounds |
| 400-600 | Low | Soft clicks |
| 600-800 | Medium-low | Default clicks |
| 800-1000 | Medium | Most sounds |
| 1000-1200 | High | Achievement fanfares |
| 1200+ | Very high | Sharp, piercing |

**Musical Notes:**
- 440 Hz = A4 (middle A)
- 523 Hz = C5
- 880 Hz = A5

### **Volume (0-1)**

Controls the **loudness**:

| Value | Loudness | When to Use |
|-------|----------|-------------|
| 0.05-0.08 | Very quiet | Gentle, subtle sounds |
| 0.09-0.12 | Quiet | Soft sounds that don't overpower |
| 0.13-0.18 | Medium | Default, balanced |
| 0.19-0.25 | Loud | Emphasize importance |
| 0.26-0.30 | Very loud | Major events (use sparingly!) |

### **Duration (seconds)**

Controls how **long** the sound plays:

| Value | Length | When to Use |
|-------|--------|-------------|
| 0.05-0.10 | Very short | Quick clicks, rapid feedback |
| 0.11-0.20 | Short | Standard clicks |
| 0.21-0.30 | Medium | Purchases, actions |
| 0.31-0.50 | Long | Achievements, milestones |
| 0.51+ | Very long | Major accomplishments |

### **Wave Types**

Controls the **character** of the sound:

| Wave Type | Sound | Best For |
|-----------|-------|----------|
| **'sine'** | Pure, smooth, musical | Clean tones, melodies |
| **'square'** | Harsh, buzzy, retro | 8-bit games, old computers |
| **'triangle'** | Soft, mellow, warm | Gentle sounds, calm themes |
| **'sawtooth'** | Bright, aggressive, buzzy | Powerful sounds, emphasis |

**Visual Representation:**
```
sine:     ∿∿∿∿ (smooth waves)
square:   ⎍⎍⎍⎍ (sharp edges)
triangle: /\/\/\ (angular)
sawtooth: ////// (jagged)
```

---

## 🎨 **Examples & Templates**

### **Space/Cosmic Theme**
```javascript
cosmic: {
    click: { frequency: 1100, volume: 0.13, duration: 0.08, waveType: 'sine' },
    buy: { frequency: 550, volume: 0.17, duration: 0.18, waveType: 'triangle' },
    achievement: { frequency: 1320, volume: 0.23, duration: 0.35, waveType: 'sawtooth' }
}
```

### **Horror/Dark Theme**
```javascript
dark: {
    click: { frequency: 300, volume: 0.09, duration: 0.15, waveType: 'sawtooth' },
    buy: { frequency: 200, volume: 0.14, duration: 0.30, waveType: 'square' },
    achievement: { frequency: 250, volume: 0.20, duration: 0.50, waveType: 'sawtooth' }
}
```

### **Happy/Upbeat Theme**
```javascript
happy: {
    click: { frequency: 880, volume: 0.12, duration: 0.08, waveType: 'sine' },
    buy: { frequency: 660, volume: 0.16, duration: 0.15, waveType: 'triangle' },
    achievement: { frequency: 1320, volume: 0.25, duration: 0.30, waveType: 'sine' }
}
```

### **Mechanical/Industrial Theme**
```javascript
industrial: {
    click: { frequency: 500, volume: 0.14, duration: 0.06, waveType: 'square' },
    buy: { frequency: 400, volume: 0.19, duration: 0.20, waveType: 'sawtooth' },
    achievement: { frequency: 600, volume: 0.27, duration: 0.35, waveType: 'square' }
}
```

### **Magical/Fantasy Theme**
```javascript
magic: {
    click: { frequency: 1000, volume: 0.11, duration: 0.12, waveType: 'triangle' },
    buy: { frequency: 800, volume: 0.15, duration: 0.22, waveType: 'sine' },
    achievement: { frequency: 1200, volume: 0.22, duration: 0.45, waveType: 'triangle' }
}
```

---

## 🎧 **METHOD 2: Audio Files (Advanced)**

For professional-quality custom sounds using actual audio files!

### **Advantages:**
- ✅ Much better sound quality
- ✅ Use any sound you want
- ✅ More realistic and polished
- ✅ Can use licensed sounds or custom recordings

### **Disadvantages:**
- ❌ Requires audio files (adds to game size)
- ❌ Need to create/find sound effects
- ❌ More setup required

### **Step 1: Prepare Audio Files**

Create a `sounds/` folder in your game directory:

```
idle-clicker-game/
├── index.html
├── game.js
├── sounds/           ← Create this folder
│   ├── click.mp3     ← Add your audio files
│   ├── buy.mp3
│   └── achievement.mp3
```

**Audio File Requirements:**
- **Format:** `.mp3` (best compatibility) or `.ogg`
- **Length:** 0.1-0.5 seconds (keep them short!)
- **File Size:** Under 50KB each (preferably)
- **Sample Rate:** 44.1kHz or 48kHz

**Where to Get Sounds:**
- **Free:** [Freesound.org](https://freesound.org/)
- **Free:** [ZapSplat](https://www.zapsplat.com/)
- **Free:** [Mixkit](https://mixkit.co/free-sound-effects/)
- **Paid:** [AudioJungle](https://audiojungle.net/)
- **Make Your Own:** Audacity (free audio editor)

### **Step 2: Add to `config.json`**

```json
{
  "id": "sound_pack_premium",
  "name": "Premium Sound Pack",
  "description": "High-quality recorded sound effects",
  "icon": "🎧",
  "cost": 1500000,
  "purchased": false,
  "value": "premium"
}
```

### **Step 3: Audio Files Auto-Load!**

The game will automatically load audio files when the `premium` pack is purchased!

**What happens:**
1. User buys "Premium Sound Pack"
2. Game detects `sound_pack_premium` is purchased
3. Automatically loads `sounds/click.mp3`, `sounds/buy.mp3`, `sounds/achievement.mp3`
4. Uses these files instead of oscillators!

### **Step 4: Update `service-worker.js`**

Add your sound files to the cache list (around line 8):

```javascript
const urlsToCache = [
    './',
    './index.html',
    './game.js',
    './styles.css',
    './config.json',
    './tips.json',
    './changelog.json',
    './version.json',
    './favicon.svg',
    './manifest.json',
    './sounds/click.mp3',      // Add these
    './sounds/buy.mp3',         // Add these
    './sounds/achievement.mp3'  // Add these
];
```

### **Step 5: Test!**

1. Add audio files to `sounds/` folder
2. Push to GitHub
3. Open game
4. Admin panel → Unlock all cosmetics
5. Settings → Select "Premium Sound Pack"
6. Click the gem - hear your custom sound!

---

## 🔊 **Creating Your Own Sounds**

### **Using Audacity (Free)**

1. **Download:** [Audacity](https://www.audacityteam.org/)
2. **Record or Generate:**
   - Generate → Tone → Create beeps
   - Or record your own sounds
3. **Edit:**
   - Keep it short (0.1-0.3 seconds)
   - Fade in/out for smoothness
   - Normalize volume
4. **Export:**
   - File → Export → MP3
   - Save to `sounds/` folder

### **Quick Sound Ideas**

**Click Sounds:**
- Snap fingers
- Tap on desk
- "Pop" sound
- Coin sound
- Button click

**Buy Sounds:**
- Cash register "cha-ching"
- Coin drop
- Success chime
- Level up sound
- Power up

**Achievement Sounds:**
- Fanfare
- Trumpet
- Applause
- Celebration
- Victory tune

---

## 🎯 **Best Practices**

### **DO:**
- ✅ Keep sounds short (0.1-0.5 seconds)
- ✅ Test at different volumes
- ✅ Make achievements sound more special than clicks
- ✅ Use similar themes across all sounds in a pack
- ✅ Keep file sizes small (under 50KB)

### **DON'T:**
- ❌ Make sounds too long (annoying!)
- ❌ Use very loud volumes (hurts ears!)
- ❌ Mix drastically different themes
- ❌ Use copyrighted music without permission
- ❌ Forget to test on different devices

---

## 🧪 **Testing Your Sounds**

### **Quick Test:**

1. Add your sound pack to config.json
2. Add sound parameters to game.js
3. Save both files
4. Refresh game (hard refresh: Ctrl+Shift+R)
5. Admin panel → Unlock all cosmetics
6. Settings → Select your new sound pack
7. Click gem to hear click sound
8. Buy something to hear buy sound
9. Unlock achievement to hear achievement sound

### **Adjust Based On:**
- **Too quiet?** Increase volume
- **Too loud?** Decrease volume
- **Too sharp/harsh?** Lower frequency or change wave type
- **Too short?** Increase duration
- **Too long?** Decrease duration

---

## 🐛 **Troubleshooting**

### **Sound pack doesn't appear in shop:**
- Check config.json syntax (use JSON validator)
- Make sure `id` and `value` match
- Hard refresh (Ctrl+Shift+R)

### **No sound plays:**
- Check Settings → Sound Enabled is ON
- Check Volume slider is not at 0
- Open F12 console for errors
- Make sure you purchased the sound pack

### **Audio files don't load:**
- Check file paths are correct (`sounds/click.mp3`)
- Make sure files exist in sounds folder
- Check browser console for errors
- Files must be `.mp3` or `.ogg` format

### **Sounds are distorted:**
- Lower the volume value
- Use shorter duration
- Try different wave type
- Check audio file isn't corrupted

---

## 📊 **Complete Example**

Here's a complete example of adding a "Synthwave" pack:

### **1. config.json** (add to sounds array):
```json
{
  "id": "sound_pack_synthwave",
  "name": "Synthwave Pack",
  "description": "80s retro electronic vibes",
  "icon": "🌆",
  "cost": 800000,
  "purchased": false,
  "value": "synthwave"
}
```

### **2. game.js** (add to soundLibrary):
```javascript
synthwave: {
    click: { frequency: 900, volume: 0.14, duration: 0.10, waveType: 'square' },
    buy: { frequency: 700, volume: 0.18, duration: 0.20, waveType: 'sawtooth' },
    achievement: { frequency: 1100, volume: 0.24, duration: 0.35, waveType: 'sawtooth' }
},
```

### **3. Test:**
- Save both files
- Refresh game
- Admin → Unlock all
- Settings → Select "Synthwave Pack"
- Enjoy your new sounds!

---

## 🎉 **Summary**

### **For Quick Custom Sounds:**
Use **Method 1 (Oscillators)**:
- Add to config.json
- Add to game.js soundLibrary
- Done!

### **For Professional Quality:**
Use **Method 2 (Audio Files)**:
- Create/find audio files
- Add to sounds/ folder
- Add to config.json
- Add to service-worker.js
- Done!

---

**Happy sound designing!** 🎵✨

