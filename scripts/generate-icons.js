const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Read the designed icon SVG
const publicDir = path.join(__dirname, '..', 'public');
const svgIcon = fs.readFileSync(path.join(publicDir, 'outfit-iq-icon.svg'), 'utf8');

async function generateIcons() {
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
