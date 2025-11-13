# 🎨 Cosmetics System Guide

This guide explains how to add new cosmetics (themes, skins, particles) to your idle clicker game!

---

## 📋 Table of Contents
- [Admin Panel Access](#admin-panel-access)
- [How Cosmetics Work](#how-cosmetics-work)
- [Adding New Cosmetics](#adding-new-cosmetics)
- [Required Values Explained](#required-values-explained)
- [Example: Adding a New Skin](#example-adding-a-new-skin)

---

## 🔑 Admin Panel Access

**NO CONSOLE NEEDED!** Just click the button:

1. Look for the **🔧 Admin** button (bottom-right corner)
2. Click it
3. Enter password: **`Admin123`**
4. Admin panel opens with all controls!

**Quick Commands:**
- `+1M` gems button
- Unlock all shop button
- Set generators/upgrades
- Trigger lucky events

---

## 🎮 How Cosmetics Work

### Structure

Cosmetics are stored in `config.json` under the `cosmetics` section:

```json
"cosmetics": {
  "enabled": true,
  "themes": [...],
  "skins": [...],
  "particles": [...]
}
```

### Categories

1. **Themes** - Change the entire UI color scheme
2. **Skins** - Change how the main gem looks
3. **Particles** - Change click particle effects

---

## ➕ Adding New Cosmetics

### Step 1: Add to config.json

Find the `cosmetics` section in `config.json` and add your item to the appropriate array.

### Step 2: Add CSS styling (for themes/skins only)

Add CSS rules in `styles.css` for your new theme or skin.

### Step 3: Test in-game!

Buy it in the Cosmetics tab, equip in Settings!

---

## 📝 Required Values Explained

Every cosmetic item needs these fields:

### Universal Fields (All Cosmetics)

```json
{
  "id": "unique_identifier",           // REQUIRED: Unique ID (no spaces)
  "name": "Display Name",              // REQUIRED: What players see
  "description": "What it does",       // REQUIRED: Short description
  "icon": "🎨",                        // REQUIRED: Emoji icon
  "cost": 1000000,                     // REQUIRED: Price in gems
  "purchased": false,                  // REQUIRED: Always false initially
  "value": "css-class-name"            // REQUIRED: CSS value or identifier
}
```

### Field Descriptions

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| **id** | string | Unique identifier | `"gem_skin_topaz"` |
| **name** | string | Display name | `"Topaz Gem Skin"` |
| **description** | string | What it does | `"Warm golden topaz gem"` |
| **icon** | string | Emoji | `"🟡"` |
| **cost** | number | Price in gems | `1500000` |
| **purchased** | boolean | Default state | `false` |
| **value** | string | CSS class or effect name | `"topaz"` |

### Value Field Rules

**For Themes:**
- Use: `"theme-name"` (hyphenated)
- Example: `"ocean-blue"`, `"sunset-orange"`
- Will become CSS class: `.theme-ocean-blue`

**For Skins:**
- Use: just the name (no suffix)
- Example: `"ruby"`, `"sapphire"`, `"topaz"`
- Will become CSS class: `.skin-ruby`

**For Particles:**
- Use: effect name
- Example: `"rainbow"`, `"golden"`, `"ice"`
- Used in JavaScript for color arrays

---

## 🎨 Example: Adding a New Skin

Let's add a **Topaz** (yellow/orange) gem skin!

### Step 1: Add to config.json

Find `"cosmetics"` → `"skins"` and add:

```json
{
  "id": "gem_skin_topaz",
  "name": "Topaz Gem Skin",
  "description": "Warm golden-orange topaz gem",
  "icon": "🟡",
  "cost": 1800000,
  "purchased": false,
  "value": "topaz"
}
```

### Step 2: Add CSS in styles.css

Add this at the end of the `/* GEM SKINS */` section:

```css
/* Topaz Gem Skin - Faceted */
body.skin-topaz .main-clicker {
    background: 
        linear-gradient(135deg, transparent 25%, rgba(255, 193, 7, 0.9) 25%, rgba(255, 193, 7, 0.9) 50%, transparent 50%),
        linear-gradient(45deg, transparent 25%, rgba(255, 152, 0, 0.8) 25%, rgba(255, 152, 0, 0.8) 50%, transparent 50%),
        linear-gradient(-45deg, #ff9800 0%, #f57c00 100%);
    background-size: 60px 60px, 60px 60px, 100% 100%;
    background-position: 0 0, 30px 30px, center;
    box-shadow: 
        0 10px 40px rgba(255, 152, 0, 0.8),
        0 0 100px rgba(255, 152, 0, 0.5),
        inset -10px -10px 30px rgba(245, 124, 0, 0.7),
        inset 10px 10px 30px rgba(255, 193, 7, 0.4),
        inset 0 0 60px rgba(255, 152, 0, 0.3);
    border: 3px solid rgba(255, 193, 7, 0.7);
    position: relative;
}

body.skin-topaz .main-clicker::before {
    content: '';
    position: absolute;
    top: 10%;
    left: 10%;
    width: 30%;
    height: 30%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.4), transparent);
    border-radius: 50%;
    pointer-events: none;
}

body.skin-topaz .main-clicker:hover {
    box-shadow: 
        0 15px 50px rgba(255, 152, 0, 1),
        0 0 120px rgba(255, 152, 0, 0.7),
        inset -10px -10px 30px rgba(245, 124, 0, 0.8),
        inset 10px 10px 30px rgba(255, 193, 7, 0.6),
        inset 0 0 80px rgba(255, 152, 0, 0.5);
    transform: scale(1.05) rotate(5deg);
}

body.skin-topaz .main-clicker:active {
    transform: scale(0.95);
}

body.skin-topaz .floating-number {
    color: #ffc107;
    text-shadow: 0 0 10px rgba(255, 152, 0, 1),
                 0 0 20px rgba(255, 152, 0, 0.7),
                 0 0 30px rgba(245, 124, 0, 0.5);
    font-weight: bold;
}
```

### Step 3: Add gem icon mapping in game.js

Find the `applyCosmetics()` function and add to the `skinIcons` object:

```javascript
const skinIcons = {
    'default': this.config.game.clickableIcon,
    'ruby': '🔴',
    'sapphire': '🔵',
    'emerald': '🟢',
    'amethyst': '🟣',
    'topaz': '🟡'  // ADD THIS LINE
};
```

### Step 4: Test it!

1. Hard refresh: `Ctrl + Shift + R`
2. Admin panel → Add 5M gems
3. Go to Cosmetics tab
4. Buy Topaz skin
5. Go to Settings → Gem Skin → Select Topaz
6. Enjoy your new gem!

---

## 🌈 Example: Adding a New Particle Effect

Let's add **Electric** (blue/white lightning) particles!

### Step 1: Add to config.json

Find `"cosmetics"` → `"particles"` and add:

```json
{
  "id": "electric_particles",
  "name": "Electric Particles",
  "description": "Crackling electric lightning effects",
  "icon": "⚡",
  "cost": 850000,
  "purchased": false,
  "value": "electric"
}
```

### Step 2: Add particle colors in game.js

Find the `createParticles()` function and add a new case:

```javascript
switch (this.settings.particleEffect) {
    // ... existing cases ...
    case 'electric':
        colors = ['#00BFFF', '#87CEEB', '#FFFFFF', '#E0FFFF', '#B0E0E6', '#4682B4'];
        break;
}
```

That's it! No CSS needed for particles.

---

## 🌄 Example: Adding a New Theme

Let's add a **Midnight Black** theme!

### Step 1: Add to config.json

Find `"cosmetics"` → `"themes"` and add:

```json
{
  "id": "theme_midnight",
  "name": "Midnight Black Theme",
  "description": "Deep space black theme",
  "icon": "🌌",
  "cost": 1800000,
  "purchased": false,
  "value": "midnight-black"
}
```

### Step 2: Add CSS in styles.css

Add this in the `/* THEMES */` section:

```css
/* ============================================
   COSMETIC CUSTOMIZATION - MIDNIGHT BLACK THEME
   ============================================ */

body.theme-midnight-black {
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
}

body.theme-midnight-black .header {
    background: rgba(26, 26, 26, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

body.theme-midnight-black .header h1 {
    background: linear-gradient(135deg, #ffffff, #b0b0b0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

body.theme-midnight-black .stat-item {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

body.theme-midnight-black .main-clicker {
    background: radial-gradient(circle, #4a4a4a, #2a2a2a);
    box-shadow: 0 10px 40px rgba(255, 255, 255, 0.3),
                0 0 100px rgba(255, 255, 255, 0.2);
    border: 3px solid rgba(255, 255, 255, 0.3);
}

body.theme-midnight-black .main-clicker:hover {
    box-shadow: 0 15px 50px rgba(255, 255, 255, 0.5),
                0 0 120px rgba(255, 255, 255, 0.3);
}

body.theme-midnight-black .upgrade-item {
    background: rgba(26, 26, 26, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

body.theme-midnight-black .upgrade-item:hover:not(.disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: #ffffff;
    box-shadow: 0 5px 20px rgba(255, 255, 255, 0.2);
}

body.theme-midnight-black .prestige-button,
body.theme-midnight-black .rebirth-button {
    background: linear-gradient(135deg, #4a4a4a, #2a2a2a);
    border: 2px solid #ffffff;
}

body.theme-midnight-black .prestige-button:hover,
body.theme-midnight-black .rebirth-button:hover {
    background: linear-gradient(135deg, #6a6a6a, #4a4a4a);
    box-shadow: 0 8px 25px rgba(255, 255, 255, 0.3);
}

body.theme-midnight-black .tab-btn.active {
    background: rgba(255, 255, 255, 0.1);
    border-bottom: 3px solid #ffffff;
}

body.theme-midnight-black .lucky-event-banner {
    background: linear-gradient(135deg, #4a4a4a, #2a2a2a);
    border: 2px solid #ffffff;
}
```

---

## 🔍 Finding Values

### How do I know if my values are correct?

**IDs:**
- Must be unique
- Use lowercase with underscores
- Pattern: `category_name_type`
- Examples: `gem_skin_topaz`, `theme_midnight`, `electric_particles`

**Values:**
- For **themes**: Use hyphenated name (matches CSS class)
- For **skins**: Use simple name (game adds `skin-` prefix)
- For **particles**: Use simple name (matched in switch statement)

**Icons:**
- Use emojis!
- Pick ones that represent the item visually
- Examples: 💎 🟡 🔵 🟢 🟣 ⚡ 🔥 ❄️ 🌈 🌊 🌲 🌅

**Costs:**
- Balance progression
- Rare/cool items should cost more
- Typical range: 500K - 2M gems

---

## ✅ Checklist for Adding Cosmetics

### For ANY Cosmetic:
- [ ] Added to `config.json` in correct category
- [ ] Unique ID
- [ ] All required fields filled
- [ ] Cost is reasonable
- [ ] Good icon chosen

### For Themes:
- [ ] CSS added to `styles.css`
- [ ] All elements styled (header, buttons, tabs, etc.)
- [ ] Tested in light and dark base modes

### For Skins:
- [ ] CSS added to `styles.css`
- [ ] Icon mapping added to `game.js`
- [ ] Faceted effect applied
- [ ] Hover/active states defined
- [ ] Floating number colors match

### For Particles:
- [ ] Color array added to `game.js` `createParticles()` function
- [ ] 5-6 colors for variety
- [ ] Colors match the theme

---

## 🐛 Troubleshooting

**Cosmetic doesn't show in shop:**
- Check `config.json` syntax (commas, brackets)
- Hard refresh: `Ctrl + Shift + R`
- Check browser console for errors

**Can't equip after buying:**
- Check Settings dropdown updates
- Verify ID matches between config and CSS
- Clear browser cache

**Theme doesn't apply:**
- Check CSS class name matches `value` in config
- Ensure you're using the class on `body` element
- Check if base theme is overriding

**Purple theme not working:**
- Value should be: `"deep-purple"` (not `"dark-purple"`)
- CSS class should be: `.theme-deep-purple`

---

## 🎓 Pro Tips

1. **Copy existing cosmetics** as templates
2. **Use color palettes** from coolors.co
3. **Test affordability** - make sure colors are visible
4. **Keep consistent** - follow existing patterns
5. **Document your additions** - add comments in code

---

## 🚀 Quick Reference

```json
// Theme Template
{
  "id": "theme_NAME",
  "name": "Display Name Theme",
  "description": "Description here",
  "icon": "🌈",
  "cost": 1000000,
  "purchased": false,
  "value": "name-here"
}

// Skin Template
{
  "id": "gem_skin_NAME",
  "name": "Name Gem Skin",
  "description": "Description here",
  "icon": "💎",
  "cost": 1500000,
  "purchased": false,
  "value": "name"
}

// Particle Template
{
  "id": "NAME_particles",
  "name": "Name Particles",
  "description": "Description here",
  "icon": "✨",
  "cost": 600000,
  "purchased": false,
  "value": "name"
}
```

---

**Need help?** Check the existing cosmetics in `config.json` for examples!

**Admin password:** `Admin123` (click 🔧 Admin button)

