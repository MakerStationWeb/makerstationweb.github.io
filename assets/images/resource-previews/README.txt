Place static card preview images in this folder.

Automation commands:
1) Capture PNG previews from all resource card URLs
   - npm i -D playwright
   - npx playwright install chromium
   - node scripts/capture-previews.mjs

2) Optional: convert PNG previews to WebP
   - npm i -D sharp
   - node scripts/convert-previews-to-webp.mjs

How previews are matched:
1) If a card has data-image, that file path is used first.
2) Otherwise, the card title (h3) is converted to a slug and looked up as:
   - <slug>.webp
   - <slug>.png
   - <slug>.jpg
   - <slug>.jpeg

Examples:
- "Thingiverse" -> thingiverse.webp
- "Boxes.py (Festi's Boxes)" -> boxes-py-festi-s-boxes.webp
- "British Museum on Sketchfab" -> british-museum-on-sketchfab.webp

Recommended image size:
- 1200x675 (16:9)

Recommended format:
- WebP for best size and quality.
