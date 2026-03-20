import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'pages');
const OUTPUT_DIR = path.join(ROOT, 'assets', 'images', 'resource-previews');
const CONFIG_PATH = path.join(ROOT, 'scripts', 'resources.json');

const PAGE_FILES = [
  'laser-cutting.html',
  '3d-printing.html',
  'silhouette.html',
  'clay-printer.html',
  'rotosonic-nucleus.html',
  '3d-scanner.html'
];

const VIEWPORT = { width: 1200, height: 675 };
const WAIT_AFTER_LOAD_MS = 2200;
const NAV_TIMEOUT_MS = 45000;

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ''));
}

async function loadConfig() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      include: Array.isArray(parsed.include) ? parsed.include : [],
      overrides: Array.isArray(parsed.overrides) ? parsed.overrides : [],
      excludeSlugs: Array.isArray(parsed.excludeSlugs) ? parsed.excludeSlugs : []
    };
  } catch {
    return { include: [], overrides: [], excludeSlugs: [] };
  }
}

async function discoverResources(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const discovered = [];

  for (const file of PAGE_FILES) {
    const filePath = path.join(PAGES_DIR, file);
    const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;

    await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });

    const items = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.resource-card'));
      return cards
        .map((card) => {
          const title = card.querySelector('h3')?.textContent?.trim() || '';
          const url = card.querySelector('.tool-preview')?.getAttribute('data-url') || '';
          return { title, url };
        })
        .filter((item) => item.title && item.url && item.url !== 'about:blank');
    });

    discovered.push(...items);
  }

  await page.close();
  return discovered;
}

function mergeResources(discovered, config) {
  const map = new Map();

  const queue = [...discovered, ...config.include];
  for (const item of queue) {
    const title = String(item.title || '').trim();
    const url = String(item.url || '').trim();
    const slug = String(item.slug || slugify(title)).trim();
    if (!title || !url || !slug || !isHttpUrl(url)) continue;
    map.set(slug, { slug, title, url });
  }

  for (const item of config.overrides) {
    const title = String(item.title || '').trim();
    const url = String(item.url || '').trim();
    const slug = String(item.slug || slugify(title)).trim();
    if (!title || !url || !slug || !isHttpUrl(url)) continue;
    map.set(slug, { slug, title, url });
  }

  for (const slug of config.excludeSlugs) {
    map.delete(String(slug));
  }

  return Array.from(map.values()).sort((a, b) => a.slug.localeCompare(b.slug));
}

async function saveManifest(resources) {
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  await fs.writeFile(manifestPath, `${JSON.stringify(resources, null, 2)}\n`, 'utf8');
}

async function captureResources(browser, resources) {
  const context = await browser.newContext({ viewport: VIEWPORT });

  let okCount = 0;
  let failCount = 0;

  for (const [index, item] of resources.entries()) {
    const outPath = path.join(OUTPUT_DIR, `${item.slug}.png`);
    const progress = `${index + 1}/${resources.length}`;
    const page = await context.newPage();

    try {
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
      await page.waitForTimeout(WAIT_AFTER_LOAD_MS);
      await page.screenshot({ path: outPath, type: 'png', fullPage: false });
      okCount += 1;
      console.log(`[${progress}] OK   ${item.slug} <- ${item.url}`);
    } catch (error) {
      failCount += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[${progress}] FAIL ${item.slug} <- ${item.url}`);
      console.log(`         ${message}`);
    } finally {
      await page.close();
    }
  }

  await context.close();
  return { okCount, failCount };
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const config = await loadConfig();
    const discovered = await discoverResources(browser);
    const resources = mergeResources(discovered, config);

    if (!resources.length) {
      console.log('No resources found to capture.');
      return;
    }

    console.log(`Discovered ${resources.length} resources to capture.`);
    await saveManifest(resources);

    const { okCount, failCount } = await captureResources(browser, resources);
    console.log(`Done. Captured: ${okCount}, Failed: ${failCount}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
