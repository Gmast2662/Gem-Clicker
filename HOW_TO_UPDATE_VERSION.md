# 🔄 How to Update Version Number

## 📝 **Simple 3-Step Process**

When you want to release a new version (e.g., v1.6.0 → v1.7.0):

---

## **Step 1: Update version.json**

Open `version.json` and change:

```json
{
  "version": "1.7.0",
  "buildDate": "2024-11-15",
  "buildNumber": 107
}
```

**Fields:**
- `version` - Your version number (1.7.0, 1.8.0, etc.)
- `buildDate` - Today's date (YYYY-MM-DD)
- `buildNumber` - Increment by 1 each update

---

## **Step 2: Update service-worker.js**

Open `service-worker.js` and change the top:

```javascript
const CACHE_VERSION = '1.7.0';  // ← Match version.json
const BUILD_NUMBER = 107;        // ← Match version.json
```

**Why both files?**
- `version.json` → Shows in game UI (bottom-left)
- `service-worker.js` → Triggers cache update for users

---

## **Step 3: Push to GitHub**

```bash
git add version.json service-worker.js
git commit -m "Update to v1.7.0"
git push
```

**That's it!** ✅

---

## 🎯 **What Happens Automatically:**

1. ✅ Version display updates (bottom-left corner)
2. ✅ Service worker detects new cache version
3. ✅ Users get "Update available" notification
4. ✅ Changelog shows new version

---

## 📋 **Full Update Checklist**

When releasing a new version:

### Required:
- [ ] Update `version.json` (version, date, build number)
- [ ] Update `service-worker.js` (CACHE_VERSION, BUILD_NUMBER)
- [ ] Commit and push

### Recommended:
- [ ] Update `changelog.json` (add new version entry)
- [ ] Update `README.md` if major changes
- [ ] Test locally before pushing

---

## 🔢 **Version Numbering Guide**

### **Format:** `MAJOR.MINOR.PATCH`

**Examples:**
- `1.6.0` → `1.6.1` = Small fix (patch)
- `1.6.0` → `1.7.0` = New features (minor)
- `1.6.0` → `2.0.0` = Major overhaul (major)

### **When to Increment:**

**Patch (1.6.0 → 1.6.1):**
- Bug fixes
- Small tweaks
- Balance adjustments

**Minor (1.6.0 → 1.7.0):**
- New features
- New cosmetics
- New shop items

**Major (1.6.0 → 2.0.0):**
- Complete redesign
- Breaking changes
- Massive updates

---

## 📊 **Build Number**

**Build number increments EVERY update:**

- v1.6.0 build 105
- v1.6.1 build 106
- v1.6.2 build 107
- v1.7.0 build 108

**Why?**
- Unique identifier for each deploy
- Helpful for debugging
- Shows in version tooltip (hover over version display)

---

## 🧪 **Testing Version Display**

### **After Updating:**

1. **Update version.json** to v1.7.0
2. **Update service-worker.js** to match
3. **Push to GitHub**
4. **Wait 2 minutes**
5. **Visit game**
6. **Look at bottom-left corner** → Should show "v1.7.0"
7. **Hover over it** → Tooltip shows build number & date

---

## 💡 **Pro Tips**

### **Tip 1: Keep Them in Sync**
Always update BOTH files:
- version.json
- service-worker.js

If they don't match, users might see wrong version in UI.

### **Tip 2: Increment Build Number**
Even for small changes:
- Helps track exact deploy
- Shows users it's truly updated

### **Tip 3: Use Descriptive Dates**
- Shows when version was released
- Helpful for troubleshooting

### **Tip 4: Test Before Pushing**
- Open game locally
- Check version display works
- Then push to production

---

## ⚡ **Quick Reference Card**

```
┌─────────────────────────────────────────┐
│ UPDATING VERSION NUMBER                 │
├─────────────────────────────────────────┤
│ 1. version.json                         │
│    - version: "1.7.0"                   │
│    - buildNumber: 107                   │
│    - buildDate: "2024-11-15"            │
│                                         │
│ 2. service-worker.js (lines 4-5)       │
│    - CACHE_VERSION = '1.7.0'           │
│    - BUILD_NUMBER = 107                 │
│                                         │
│ 3. git push                             │
│                                         │
│ Done! ✅                                │
└─────────────────────────────────────────┘
```

---

## 🎮 **Where Version Appears:**

**Bottom-Left Corner:**
```
┌──────┐
│v1.6.0│ ← Visible, semi-transparent
└──────┘
```

**On Hover:**
```
┌─────────────────────────────┐
│ v1.6.0                      │
│ Build 106 - 2024-11-14      │ ← Tooltip
└─────────────────────────────┘
```

---

## 🐛 **Troubleshooting**

### **Version not updating in game:**
- Hard refresh: Ctrl + Shift + R
- Clear cache and reload
- Check version.json has correct value

### **Users not seeing update notification:**
- Make sure you changed BUILD_NUMBER in service-worker.js
- Wait 2-3 minutes for GitHub Pages to deploy
- User needs to refresh or wait 5 min

### **Version shows "v1.6.0" after updating:**
- Check version.json uploaded correctly
- Hard refresh browser
- Check browser console for errors

---

## 🎉 **That's It!**

**Two files to update:**
1. `version.json`
2. `service-worker.js`

**Both files in one place** → Easy to remember!

**Version displays automatically** → Users always know what version they have!

**Updates auto-detected** → Users get notified!

---

**Simple, automatic, and user-friendly!** ✨

