# Chrome Storage Usage in CoverCraft AI

This document explains how `chrome.storage` is used in the CoverCraft AI extension.

## 🎯 What is Chrome Storage Used For?

The extension uses Chrome's storage API to provide a seamless, persistent experience. Here's exactly what gets stored:

## 📦 Storage Categories

### 1. **User Preferences** (Always Saved)
Automatically remembers your preferred settings:

```typescript
{
  language: 'English' | 'Spanish' | 'French' | etc.,
  tone: 'Professional' | 'Friendly' | 'Enthusiastic',
  length: 'Short' | 'Medium' | 'Long'
}
```

**Why?** So you don't have to select the same options every time you generate a letter.

**When saved?** Immediately when you change language, tone, or length settings.

---

### 2. **Draft Auto-Save** (Real-time)
Saves your work-in-progress every second:

```typescript
{
  draftJobDescription: string,    // The job posting text
  draftCompanyName: string,        // Target company
  draftJobTitle: string,           // Position title
  draftJobLink: string,            // URL to job posting
  draftAdditionalInstructions: string  // Custom instructions
}
```

**Why?** Prevents data loss if you accidentally close the panel or browser crashes.

**When saved?** Auto-saves 1 second after you stop typing (debounced).

**Example scenario:**
- You're filling out a long job description
- You accidentally close the side panel
- When you reopen it, all your text is still there! ✨

---

### 3. **User Information** (Optional Cache)
Stores basic info for auto-fill:

```typescript
{
  fullName: string,
  email: string,
  phone: string,
  resumeText: string,           // Parsed resume content
  resumeData: string,            // Base64 encoded resume
  resumeMimeType: string         // PDF or DOCX
}
```

**Why?** Quick auto-fill so you don't need to re-upload your resume every time.

**When saved?** When you upload a resume or enter personal details.

**Privacy note:** This data stays on YOUR computer only. It never syncs to other devices.

---

### 4. **Letter History** (Last 10)
Keeps a record of your recent cover letters:

```typescript
{
  letterHistory: [
    {
      id: string,                // Unique timestamp ID
      timestamp: number,          // When it was generated
      companyName: string,        // Company name
      jobTitle: string,           // Job title
      content: string             // Full letter text
    },
    // ... up to 10 most recent letters
  ]
}
```

**Why?** 
- Quick access to recently generated letters
- Review and compare different versions
- Reuse or reference past work

**When saved?** After each successful letter generation.

**Limit:** Only the 10 most recent letters are kept (oldest are automatically removed).

---

## 🔍 How Much Storage is Used?

Chrome extensions get **10 MB** of local storage. CoverCraft uses:

| Data Type | Typical Size | Max Size |
|-----------|--------------|----------|
| Preferences | < 1 KB | < 1 KB |
| Draft Form | 1-5 KB | ~50 KB |
| Resume Cache | 50-500 KB | ~2 MB |
| History (10 letters) | 50-200 KB | ~500 KB |
| **Total** | **~100-700 KB** | **~3 MB** |

You'll use less than 10% of the available storage even with full history and cached resume.

---

## 🛡️ Privacy & Security

### Where is data stored?
- **Locally on your computer** using Chrome's storage API
- **NOT synced** to other devices or cloud
- **NOT sent to any servers** except when generating letters (via your Vercel API)

### What gets sent to the API?
Only the data needed to generate a letter:
- Job description
- Company/position details
- Your resume text
- Generation preferences

### Can I clear the storage?
Yes! Three ways:

1. **Clear all extension data:**
   ```javascript
   // Open browser console on the extension
   chrome.storage.local.clear()
   ```

2. **Remove the extension:**
   - Go to `chrome://extensions/`
   - Remove CoverCraft AI
   - This deletes all stored data

3. **Use Chrome's settings:**
   - Settings → Privacy and security → Site Settings
   - View permissions and data stored in installed apps

---

## 💡 Benefits of Storage

### Without Storage (Traditional Web App):
- ❌ Lose all data when closing tab
- ❌ Re-enter preferences every time
- ❌ Re-upload resume for each letter
- ❌ Can't access previous letters

### With Storage (Extension):
- ✅ Persistent drafts across sessions
- ✅ Preferences remembered
- ✅ Resume cached for quick reuse
- ✅ History of past letters
- ✅ No data loss from accidental closes

---

## 🔧 Developer Reference

### Storage Service API

Import the storage service:
```typescript
import { storageService } from './services/storageService';
```

#### Save Data
```typescript
// Save any data
await storageService.save({
  language: 'English',
  tone: 'Professional'
});

// Save draft
await storageService.saveDraft(formData);

// Save preferences
await storageService.savePreferences({ language, tone, length });

// Add to history
await storageService.addToHistory({
  companyName: 'Example Corp',
  jobTitle: 'Engineer',
  content: 'Letter content...'
});
```

#### Load Data
```typescript
// Load all data
const allData = await storageService.load();

// Load specific keys
const data = await storageService.load(['language', 'tone']);

// Load draft
const draft = await storageService.loadDraft();

// Load preferences
const prefs = await storageService.loadPreferences();

// Get history
const history = await storageService.getHistory();
```

#### Remove/Clear Data
```typescript
// Remove specific keys
await storageService.remove(['draftJobDescription', 'draftCompanyName']);

// Clear everything
await storageService.clear();
```

---

## 🔄 Web vs Extension Behavior

The storage service automatically detects the environment:

| Feature | Web App | Chrome Extension |
|---------|---------|------------------|
| Storage API | `localStorage` | `chrome.storage.local` |
| Sync to other devices | No | No |
| Max size | ~5-10 MB | ~10 MB |
| Access from | Same origin only | Extension context |

Both work identically in your code - no changes needed!

---

## ❓ FAQ

**Q: Is my data sent to Google?**
A: No. Chrome storage is local-only and not synced to Google's servers.

**Q: Can I use the extension offline?**
A: Form data persists offline, but you need internet to generate letters (API call).

**Q: What happens if I reach the 10 MB limit?**
A: Very unlikely with typical use. If it happens, old history entries are automatically removed.

**Q: Can I export my stored data?**
A: You can manually export by opening DevTools → Application → Storage and copying the data.

**Q: Does clearing browser history delete extension data?**
A: No. Extension storage is separate from browsing history.

---

## 📊 Monitoring Storage Usage

To check what's stored (for debugging):

1. Open the extension side panel
2. Right-click → Inspect
3. Go to **Application** tab → **Storage** → **Local Storage** or **Chrome Extension Storage**
4. View all stored keys and values

---

**Questions?** Check the main [EXTENSION.md](./EXTENSION.md) guide or open an issue on GitHub.


