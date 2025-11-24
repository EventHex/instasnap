const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, "public", "icons");
const svgPath = path.join(iconsDir, "icon.svg");

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  console.log("Generating PWA icons...");

  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

    await sharp(svgPath).resize(size, size).png().toFile(outputPath);

    console.log(`✓ Generated ${size}x${size} icon`);
  }

  // Generate apple-touch-icon
  await sharp(svgPath)
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));

  console.log("✓ Generated apple-touch-icon.png");
  console.log("✨ All icons generated successfully!");
}

generateIcons().catch(console.error);
