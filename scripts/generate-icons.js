const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Simple, modern hanger icon with "IQ" text
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3d3730"/>
      <stop offset="100%" style="stop-color:#2a2520"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>

  <!-- Hanger shape -->
  <g transform="translate(256, 200)">
    <!-- Hook -->
    <path d="M0,-80 Q30,-80 30,-50 Q30,-20 0,-20"
          stroke="#f5f5f0" stroke-width="20" fill="none" stroke-linecap="round"/>
    <!-- Arms -->
    <path d="M0,0 L-140,100"
          stroke="#f5f5f0" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path d="M0,0 L140,100"
          stroke="#f5f5f0" stroke-width="20" fill="none" stroke-linecap="round"/>
    <!-- Bottom bar -->
    <path d="M-140,100 L140,100"
          stroke="#f5f5f0" stroke-width="20" fill="none" stroke-linecap="round"/>
  </g>

  <!-- IQ text -->
  <text x="256" y="440"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="80"
        font-weight="700"
        fill="#f5f5f0"
        text-anchor="middle">IQ</text>
</svg>
`;

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const svgBuffer = Buffer.from(svgIcon);

  // Generate different sizes
  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon.ico', size: 32 },
  ];

  for (const { name, size } of sizes) {
    const outputPath = path.join(publicDir, name);

    if (name.endsWith('.ico')) {
      // For favicon, create a 32x32 PNG (browsers accept PNG favicons)
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath.replace('.ico', '.png'));
      console.log(`Generated ${name.replace('.ico', '.png')} (${size}x${size})`);
    } else {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`Generated ${name} (${size}x${size})`);
    }
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
