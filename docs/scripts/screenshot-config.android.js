/**
 * Google Play screenshot config.
 * → fastlane/metadata/android/<locale>/images/{phone,sevenInch,tenInch}Screenshots/
 */

const fs = require('fs');
const path = require('path');

const BASE_URL =
  process.env.SCREENSHOT_BASE_URL ??
  'https://www.puzzleinteract.com/prototype/mobile/word-wheel/screenshot';

const LOCALES = [
  { locale: 'en-US', lang: 'en' },
  { locale: 'fr-FR', lang: 'fr' },
  { locale: 'zh-CN', lang: 'zh' },
  { locale: 'hi-IN', lang: 'hi' },
  { locale: 'es-ES', lang: 'es' },
  { locale: 'ar', lang: 'ar' },
  { locale: 'pt-BR', lang: 'pt' },
  { locale: 'de-DE', lang: 'de' },
  { locale: 'ja-JP', lang: 'ja' },
  { locale: 'ko-KR', lang: 'ko' },
];

const DEVICES = {
  phone: {
    name: 'phone',
    playFolder: 'phoneScreenshots',
    viewport: { width: 1080, height: 2361 },
    deviceScaleFactor: 1,
  },
  sevenInch: {
    name: 'sevenInch',
    playFolder: 'sevenInchScreenshots',
    viewport: { width: 1080, height: 1728 },
    deviceScaleFactor: 1,
  },
  tenInch: {
    name: 'tenInch',
    playFolder: 'tenInchScreenshots',
    viewport: { width: 1080, height: 1728 },
    deviceScaleFactor: 1,
  },
};

const SCENE_START = Number(process.env.SCREENSHOT_START ?? 1);
const SCENE_END = Number(process.env.SCREENSHOT_END ?? 8);
const PRIMARY_LOCALE = 'en-US';

function padScene(n) {
  return String(n).padStart(2, '0');
}

function sceneSlugs() {
  const slugs = [];
  for (let i = SCENE_START; i <= SCENE_END; i += 1) {
    slugs.push(padScene(i));
  }
  return slugs;
}

function buildSceneUrl(slug, lang) {
  return `${BASE_URL}/${slug}?lang=${lang}`;
}

function parseLocaleFilter() {
  const raw = process.env.SNAPSHOT_LANGUAGES?.trim();
  if (!raw || raw === 'all') {
    return LOCALES;
  }
  const wanted = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const filtered = LOCALES.filter(({ locale }) => wanted.includes(locale));
  if (filtered.length === 0) {
    throw new Error(
      `SNAPSHOT_LANGUAGES matched nothing. Use: all or ${LOCALES.map((l) => l.locale).join(', ')}`
    );
  }
  return filtered;
}

function parseDeviceFilter() {
  const raw = process.env.SCREENSHOT_DEVICES?.trim();
  if (!raw || raw === 'all') {
    return Object.values(DEVICES);
  }
  const wanted = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const filtered = wanted.map((key) => DEVICES[key]).filter(Boolean);
  if (filtered.length === 0) {
    throw new Error(
      `SCREENSHOT_DEVICES matched nothing. Use: all or ${Object.keys(DEVICES).join(', ')}`
    );
  }
  return filtered;
}

function screenshotsRoot() {
  return path.join(__dirname, '..', '..', 'fastlane', 'metadata', 'android');
}

function outputDir(locale, device) {
  return path.join(screenshotsRoot(), locale, 'images', device.playFolder);
}

function outputFile(locale, device, slug) {
  return path.join(outputDir(locale, device), `${slug}.png`);
}

function prepareOutputDir(locale, device) {
  const dir = outputDir(locale, device);
  fs.mkdirSync(dir, { recursive: true });
  if (process.env.CLEAR_SCREENSHOTS === '1') {
    for (const file of fs.readdirSync(dir)) {
      if (file.toLowerCase().endsWith('.png')) {
        fs.unlinkSync(path.join(dir, file));
      }
    }
  }
  return dir;
}

function listLocaleScreenshots(locale) {
  const localeRoot = path.join(screenshotsRoot(), locale);
  if (!fs.existsSync(localeRoot)) return [];
  const pngs = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.toLowerCase().endsWith('.png')) pngs.push(full);
    }
  };
  walk(localeRoot);
  return pngs;
}

function deviceLabelFromFile(filePath) {
  const rel = path.relative(path.join(screenshotsRoot(), path.basename(path.dirname(filePath))), filePath);
  const parts = rel.split(path.sep);
  return parts.find((p) => p.endsWith('Screenshots'))?.replace('Screenshots', '') ?? 'unknown';
}

function captureCommandHint() {
  return 'npm run screenshots:faster';
}

module.exports = {
  platform: 'android',
  BASE_URL,
  LOCALES,
  DEVICES,
  SCENE_START,
  SCENE_END,
  PRIMARY_LOCALE,
  padScene,
  sceneSlugs,
  buildSceneUrl,
  parseLocaleFilter,
  parseDeviceFilter,
  screenshotsRoot,
  outputDir,
  outputFile,
  prepareOutputDir,
  listLocaleScreenshots,
  deviceLabelFromFile,
  captureCommandHint,
};
