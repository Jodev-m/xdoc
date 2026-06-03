import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "public", "icons");

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const sizes = [192, 512];

const svgCircle = (size) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" ry="${size * 0.18}" fill="#171717"/>
  <text x="50%" y="56%" dominant-baseline="central" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="${size * 0.55}px" fill="white">X</text>
</svg>`;

for (const size of sizes) {
  const buffer = Buffer.from(svgCircle(size));
  await sharp(buffer).resize(size, size).png().toFile(resolve(outDir, `icon-${size}x${size}.png`));
  console.log(`✓ public/icons/icon-${size}x${size}.png`);
}
