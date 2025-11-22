# CoverCraft AI - Chrome Extension Guide

Generate professional cover letters instantly from any job posting page.

## Features

- **One-Click Generation**: Click the extension icon on any job posting page
- **Smart Page Analysis**: AI automatically extracts job title, company, and requirements
- **Resume Upload**: Supports PDF, DOCX, and DOC files
- **Instant PDF Download**: Cover letter is generated and downloaded as PDF immediately
- **Language Selection**: Choose your preferred output language

## Building the Extension

### Step 1: Generate Icons

```bash
# Option A: Use the icon generator script
npm run generate-icons

# Option B: Use ImageMagick
cd public/icons
convert -background none -resize 16x16 icon.svg icon16.png
convert -background none -resize 48x48 icon.svg icon48.png
convert -background none -resize 128x128 icon.svg icon128.png
```

### Step 2: Build the Extension

```bash
npm run build:extension
```

This will:
1. Build the React app with Vite in extension mode
2. Bundle the background service worker
3. Copy `manifest.json` to the `dist/` folder
4. Copy icons to `dist/icons/`

## Installing in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

## How to Use

1. **Navigate to a job posting** (LinkedIn, Indeed, Glassdoor, etc.)
2. **Click the CoverCraft icon** in your Chrome toolbar
3. **Upload your resume** (PDF, DOCX, or DOC)
4. **Select output language** (optional)
5. **Click "Generate & Download PDF"**
6. Your tailored cover letter downloads automatically!

## How It Works

1. When you click the extension, it reads the current page content
2. The AI analyzes the page to find:
   - Company name
   - Job title/position
   - Job requirements and qualifications
   - Company culture/values
3. It matches your resume against the job requirements
4. Generates a professional cover letter tailored to the specific job
5. Creates a PDF and downloads it to your computer

## Configuration

The extension keeps configuration simple:
- **Output Language**: Select from English, Spanish, French, German, or Mandarin Chinese
- Your language preference is saved for future use

For more options (tone, length, custom instructions), use the full website:
**https://covercraft-ai-ivory.vercel.app/**

## Troubleshooting

### Extension won't load
- Ensure you built with `npm run build:extension`
- Check that `dist/manifest.json` exists
- Verify all icons are in `dist/icons/`

### Page content not captured
- Some pages may block content scraping
- Try refreshing the page and reopening the extension
- For protected pages, use the full website instead

### API calls failing
- Check your internet connection
- The extension requires access to the Vercel API
- If issues persist, use the website directly

### PDF not downloading
- Ensure popups are not blocked
- Check your downloads folder
- Try a different browser if issues persist

## File Structure

```
CoverCraft/
├── manifest.json           # Chrome extension manifest
├── background.ts           # Service worker for page scraping
├── components/
│   └── PopupApp.tsx        # Extension popup UI
├── public/
│   └── icons/              # Extension icons
│       ├── icon.svg        # Source SVG
│       ├── icon16.png      # Toolbar icon
│       ├── icon48.png      # Extension management icon
│       └── icon128.png     # Installation icon
└── dist/                   # Built extension (load this in Chrome)
```

## Privacy

- Resume data is only sent to generate the cover letter and is not stored
- Page content is analyzed locally to extract job information
- Language preferences are stored locally in Chrome
- No personal data is collected or shared

## Full Website

Need more features? Visit the full website:
**https://covercraft-ai-ivory.vercel.app/**

The website offers:
- Tone selection (Professional, Enthusiastic, Confident, etc.)
- Length options (Concise, Standard, Detailed)
- Custom instructions
- Preview and edit before download
- Job URL input for pages you can't access

---

**Questions?** Open an issue on GitHub.

**Good luck with your job search!**
