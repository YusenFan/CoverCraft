/**
 * Icon Generator Script for CoverCraft AI Extension
 * 
 * This script generates PNG icons from the SVG source.
 * 
 * Usage:
 * 1. Install sharp: npm install sharp
 * 2. Run: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Error: sharp is not installed.');
  console.error('Please run: npm install sharp');
  process.exit(1);
}

const sizes = [16, 48, 128];
const svgPath = path.join(__dirname, 'public', 'icons', 'icon.svg');
const outputDir = path.join(__dirname, 'public', 'icons');

async function generateIcons() {
  console.log('Generating icons from SVG...\n');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon${size}.png`);
    
    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated icon${size}.png`);
    } catch (error) {
      console.error(`✗ Failed to generate icon${size}.png:`, error.message);
    }
  }

  console.log('\nDone! Icons generated in public/icons/');
}

// Check if SVG exists
if (!fs.existsSync(svgPath)) {
  console.error(`Error: SVG file not found at ${svgPath}`);
  process.exit(1);
}

generateIcons().catch(console.error);


