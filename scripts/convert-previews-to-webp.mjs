import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const INPUT_DIR = path.join(ROOT, 'assets', 'images', 'resource-previews');
const QUALITY = Number(process.env.WEBP_QUALITY || 82);

async function getSharp() {
  try {
    const mod = await import('sharp');
    return mod.default;
  } catch {
    throw new Error('Missing dependency: sharp. Install with: npm i -D sharp');
  }
}

async function main() {
  const sharp = await getSharp();
  const entries = await fs.readdir(INPUT_DIR, { withFileTypes: true });
  const pngFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.png'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  if (!pngFiles.length) {
    console.log('No PNG files found to convert.');
    return;
  }

  let converted = 0;
  for (const fileName of pngFiles) {
    const inputPath = path.join(INPUT_DIR, fileName);
    const outputPath = path.join(INPUT_DIR, fileName.replace(/\.png$/i, '.webp'));

    await sharp(inputPath).webp({ quality: QUALITY }).toFile(outputPath);
    converted += 1;
    console.log(`Converted: ${fileName} -> ${path.basename(outputPath)}`);
  }

  console.log(`Done. Converted ${converted} files at quality ${QUALITY}.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
