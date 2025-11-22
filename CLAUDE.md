# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CoverCraft AI is an AI-powered cover letter generator built with React + TypeScript. It has two deployment targets:
1. **Web app**: Hosted on Vercel at https://covercraft-ai-ivory.vercel.app/
2. **Chrome extension**: Popup extension that scrapes job posting pages

## Commands

```bash
# Development
npm run dev              # Start dev server at http://localhost:3000

# Build
npm run build            # Build web app for Vercel
npm run build:extension  # Build Chrome extension (outputs to dist/)

# Extension-specific
npm run generate-icons   # Generate PNG icons from SVG (requires sharp)
```

## Architecture

### Dual-Mode Application
The app detects its runtime environment and renders accordingly:
- `App.tsx` checks for `chrome.runtime.id` to determine if running as extension
- Web mode: Full two-panel layout (InputPanel + PreviewPanel)
- Extension mode: Renders `PopupApp` component as Chrome popup

### Chrome Extension (Popup Mode)
- **manifest.json**: Uses `action.default_popup` for popup UI (not side panel)
- **background.ts**: Service worker that scrapes page content on demand
- **PopupApp.tsx**: Simplified UI for extension popup
  - Scrapes current page content via background script
  - Uses LLM to extract job title, company, and requirements from page content
  - Only configurable option is output language
  - Generates PDF directly and triggers download
  - Links to full website for more options

### API Layer
- **Web**: Client calls `/api/generate` which routes to `api/generate.ts` (Vercel serverless function)
- **Extension**: Calls `https://covercraft-ai-ivory.vercel.app/api/generate` directly
- The API detects extension requests by presence of `pageContent` field and uses LLM to extract job details

The serverless function (`api/generate.ts`) handles:
- OpenAI GPT-4o integration
- Two modes: traditional (web) with explicit job fields, or extension mode with page content analysis
- Multimodal support for PDF/image resume uploads (web mode)

### Storage Abstraction
`services/storageService.ts` provides unified storage interface:
- Extension: Uses `chrome.storage.local`
- Web: Falls back to `localStorage`
- Extension only stores language preference

### Key Differences: Extension vs Web
| Feature | Web App | Extension |
|---------|---------|-----------|
| UI | Two-panel layout | Compact popup |
| Job input | Manual or URL | Auto-scraped from page |
| Configuration | Tone, length, language, custom instructions | Language only |
| Output | Preview + edit + download | Direct PDF download |

## Key Files

- `types.ts` - TypeScript interfaces and enums (Tone, Length, Language)
- `constants.ts` - Default state values
- `manifest.json` - Chrome extension manifest (popup config)
- `background.ts` - Extension service worker for page scraping
- `components/PopupApp.tsx` - Extension popup UI
- `vite.config.ts` - Conditional build config based on `--mode extension`

## Environment

Requires `OPENAI_API_KEY` in:
- `.env.local` for local development
- Vercel environment variables for production

## Resume Support

Both web and extension support:
- PDF files (parsed with pdf.js)
- DOCX files (parsed with mammoth.js)
- DOC files (limited support - users advised to convert)
- Plain text
