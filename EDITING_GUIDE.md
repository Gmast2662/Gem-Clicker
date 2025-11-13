# 📝 Easy Editing Guide

This guide shows you how to easily edit tips and changelog **without touching HTML!**

---

## ✏️ How to Edit Tips

**File:** `tips.json`

### Quick Edit

1. Open `tips.json` in any text editor
2. Edit the text you want to change
3. Save the file
4. Hard refresh the game: `Ctrl + Shift + R`

### Structure

```json
{
  "tips": [
    {
      "title": "🎯 Section Name",
      "items": [
        "Tip line 1",
        "Tip line 2",
        "Tip line 3"
      ]
    }
  ]
}
```

### Example: Adding a New Tip Section

```json
{
  "title": "🏆 Achievement Tips",
  "items": [
    "Check achievements tab often",
    "Some achievements are hidden",
    "Achievements are permanent"
  ]
}
```

### Example: Editing Existing Tip

**Before:**
```json
"Buy your first Miner at 25 gems (produces 0.1 gems/sec)"
```

**After:**
```json
"Buy your first Miner at 25 gems - it's the cheapest generator!"
```

---

## 📰 How to Edit Changelog

**File:** `changelog.json`

### Quick Edit

1. Open `changelog.json`
2. Update `currentVersion` and `currentDescription` at the top
3. Add new version to the `versions` array
4. Save and hard refresh

### Structure

```json
{
  "currentVersion": "v1.5.0",
  "currentDescription": "Short description here",
  "versions": [
    {
      "version": "v1.5.0",
      "title": "Update Name 🎨",
      "date": "November 13, 2024",
      "changes": [
        "Change 1",
        "Change 2",
        "Change 3"
      ]
    }
  ]
}
```

### Example: Adding a New Version

When you make a new update, add it to the **top** of the `versions` array:

```json
{
  "currentVersion": "v1.6.0",
  "currentDescription": "New awesome features!",
  "versions": [
    {
      "version": "v1.6.0",
      "title": "Cool New Stuff 🚀",
      "date": "November 14, 2024",
      "changes": [
        "Added new generator",
        "Fixed bug with clicking",
        "Improved UI animations"
      ]
    },
    {
      "version": "v1.5.0",
      ...existing version...
    }
  ]
}
```

---

## 🎨 Emojis You Can Use

Copy and paste these into your tips/changelog:

**General:**
- 🎮 🎯 💡 💎 ⭐ 🌟 ✨ 🔥 ⚡ 💰

**Actions:**
- 👆 ✋ 💪 🤖 🏭 ⚙️ 🔧 🛠️ 🔨 ⛏️

**Themes:**
- 🌈 🌊 🌲 🌅 🌙 ☀️ 🎨 🖌️ 🎭

**Gems:**
- 💎 💠 💚 🔮 🔴 🔵 🟢 🟣 🟡

**UI:**
- ✅ ❌ ⚠️ 📊 📈 📉 🔔 🎁 🏆

---

## 📋 Checklist for Editing

### Before Editing:
- [ ] Make a backup copy of the file
- [ ] Use a text editor (Notepad++, VSCode, etc.)
- [ ] Check JSON syntax (use jsonlint.com if unsure)

### After Editing:
- [ ] Save the file
- [ ] Hard refresh the game: `Ctrl + Shift + R`
- [ ] Check if changes appear
- [ ] If not working, check browser console (F12) for errors

---

## 🐛 Common Mistakes

### Missing Comma
```json
// WRONG:
{
  "title": "Test"
  "items": []
}

// CORRECT:
{
  "title": "Test",
  "items": []
}
```

### Extra Comma at End
```json
// WRONG:
"items": [
  "Item 1",
  "Item 2",
]

// CORRECT:
"items": [
  "Item 1",
  "Item 2"
]
```

### Quotes
```json
// WRONG:
'Single quotes'

// CORRECT:
"Double quotes"
```

---

## 🧪 Testing Your Changes

1. Edit `tips.json` or `changelog.json`
2. Save the file
3. Hard refresh: `Ctrl + Shift + R`
4. Press `8` (Tips tab) or `9` (Changelog tab)
5. See your changes!

---

## 💡 Pro Tip

**Use a JSON validator** before saving:
- Visit: https://jsonlint.com
- Paste your JSON
- Click "Validate"
- Fix any errors it finds

This prevents broken JSON from crashing the game!

---

## 🚀 Quick Reference

**Tips File:** `tips.json`
- Section format: `{"title": "...", "items": [...]}`
- Each item is a string
- Add emojis for flair!

**Changelog File:** `changelog.json`
- Update `currentVersion` when releasing
- Add new version to top of `versions` array
- Include date and list of changes

**After editing:** Always hard refresh! (`Ctrl + Shift + R`)

---

**Need help?** Check the existing content in `tips.json` and `changelog.json` for examples!

