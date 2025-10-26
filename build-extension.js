#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building WanderLingo Chrome Extension...');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy manifest.json
fs.copyFileSync(
  path.join(__dirname, 'public', 'manifest.json'),
  path.join(distDir, 'manifest.json')
);

// Copy popup files
fs.copyFileSync(
  path.join(__dirname, 'public', 'popup.html'),
  path.join(distDir, 'popup.html')
);

// Copy background.js
fs.copyFileSync(
  path.join(__dirname, 'public', 'background.js'),
  path.join(distDir, 'background.js')
);

// Copy content.js
fs.copyFileSync(
  path.join(__dirname, 'public', 'content.js'),
  path.join(distDir, 'content.js')
);

// Copy content.css
fs.copyFileSync(
  path.join(__dirname, 'public', 'content.css'),
  path.join(distDir, 'content.css')
);

// Create icons directory
const iconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create simple icon files (you can replace these with actual icons)
const iconSizes = [16, 32, 48, 128];
iconSizes.forEach(size => {
  // Create a simple SVG icon
  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="url(#gradient)"/>
      <text x="12" y="16" text-anchor="middle" fill="white" font-size="${size * 0.6}" font-family="Arial">🌍</text>
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>
  `;
  
  fs.writeFileSync(
    path.join(iconsDir, `icon${size}.png`),
    svgIcon
  );
});

console.log('✅ Chrome Extension built successfully!');
console.log('📁 Extension files are in the "dist" directory');
console.log('🔧 To install:');
console.log('   1. Open Chrome and go to chrome://extensions/');
console.log('   2. Enable "Developer mode"');
console.log('   3. Click "Load unpacked" and select the "dist" folder');
console.log('   4. The WanderLingo extension will be installed!');
