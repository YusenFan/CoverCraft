# Extension Icons

This directory contains the icons for the CoverCraft AI Chrome extension.

## Quick Icon Generation

To generate PNG icons from the SVG file, you can use one of these methods:

### Method 1: Using ImageMagick (Recommended)
```bash
# Install ImageMagick if you don't have it
brew install imagemagick

# Generate icons
convert -background none -resize 16x16 icon.svg icon16.png
convert -background none -resize 48x48 icon.svg icon48.png
convert -background none -resize 128x128 icon.svg icon128.png
```

### Method 2: Using Node.js (sharp library)
```bash
npm install sharp
node ../generate-icons.js
```

### Method 3: Online Converter
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Convert to PNG at sizes: 16x16, 48x48, 128x128
4. Save as `icon16.png`, `icon48.png`, `icon128.png`

### Method 4: Manual (macOS Preview)
1. Open `icon.svg` in Preview
2. Export as PNG
3. Resize to 16x16, 48x48, and 128x128

## Required Files
- `icon16.png` - Shown in the browser toolbar
- `icon48.png` - Used in the extensions management page
- `icon128.png` - Used during installation and in the Chrome Web Store


