// Script to generate PWA icons
// Run with: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Simple canvas-based icon generation
// For production, you'd use sharp or canvas library

const svgContent = `<svg width="SIZE" height="SIZE" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#a855f7"/>
      <stop offset="50%" style="stop-color:#ec4899"/>
      <stop offset="100%" style="stop-color:#f97316"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="#0a0a0f"/>
  <g transform="translate(156, 156) scale(0.8)">
    <path d="M128 32L224 128L128 224L32 128L128 32Z" fill="url(#grad)"/>
    <path d="M128 80L176 128L128 176L80 128L128 80Z" fill="#0a0a0f"/>
  </g>
</svg>`;

const sizes = [192, 512, 180];
const names = ['icon-192.png', 'icon-512.png', 'apple-icon-180.png'];

console.log('To generate PNG icons, install sharp:');
console.log('npm install sharp --save-dev');
console.log('');
console.log('Then run this script again, or use an online SVG to PNG converter.');
console.log('');
console.log('For now, the app will work with the SVG icon.');

// Write SVG versions as fallback
sizes.forEach((size, i) => {
  const svg = svgContent.replace(/SIZE/g, size);
  const svgPath = path.join(__dirname, '..', 'public', 'icons', names[i].replace('.png', '.svg'));
  fs.writeFileSync(svgPath, svg);
  console.log(`Created: ${svgPath}`);
});

