/**
 * App Store screenshot config (fastlane deliver).
 * → ios/fastlane/screenshots/<locale>/iPhone 6.7"-01.png, iPad Pro 13"-01.png, …
 */

const fs = require('fs');
const path = require('path');

const BASE_URL =
  process.env.SCREENSHOT_BASE_URL ??
  'https://www.puzzleinteract.com/prototype/mobile/word-wheel/screenshot';

/** App Store Connect locale folder → ?lang= code */
const LOCALES = [
  { locale: 'en-CA', lang: 'en' },
  { locale: 'fr-FR', lang: 'fr' },
  { locale: 'zh-Hans', lang: 'zh' },
  { locale: 'hi', lang: 'hi' },
  { locale: 'es-ES', lang: 'es' },
  { locale: 'ar-SA', lang: 'ar' },
  { locale: 'pt-BR', lang: 'pt' },
  { locale: 'de-DE', lang: 'de' },
  { locale: 'ja', lang: 'ja' },
  { locale: 'ko', lang: 'ko' },
];

/** App Store device slots (portrait). Names match fastlane deliver folders. */
const DEVICES = {
  iphone67: {
    name: 'iphone67',
    filePrefix: 'iPhone 6.7"',
    viewport: { width: 1290, height: 2796 },
    deviceScaleFactor: 1,
  },
  ipad13: {
    name: 'ipad13',
    filePrefix: 'iPad Pro 13"',
    viewport: { width: 2064, height: 2752 },
    deviceScaleFactor: 1,
  },
};

const SCENE_START = Number(process.env.SCREENSHOT_START ?? 1);
const SCENE_END = Number(process.env.SCREENSHOT_END ?? 8);
const PRIMARY_LOCALE = 'en-CA';

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
  return path.join(__dirname, '..', '..', 'ios', 'fastlane', 'screenshots');
}

function outputDir(locale) {
  return path.join(screenshotsRoot(), locale);
}

function outputFile(locale, device, slug) {
  return path.join(outputDir(locale), `${device.filePrefix}-${slug}.png`);
}

function prepareOutputDir(locale, device) {
  const dir = outputDir(locale);
  fs.mkdirSync(dir, { recursive: true });
  if (process.env.CLEAR_SCREENSHOTS === '1') {
    for (const file of fs.readdirSync(dir)) {
      if (!file.toLowerCase().endsWith('.png')) continue;
      if (device.filePrefix && !file.startsWith(device.filePrefix)) continue;
      fs.unlinkSync(path.join(dir, file));
    }
  }
  return dir;
}

function listLocaleScreenshots(locale) {
  const dir = outputDir(locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .map((f) => path.join(dir, f));
}

function deviceLabelFromFile(filePath) {
  const base = path.basename(filePath);
  const dash = base.indexOf('-');
  return dash > 0 ? base.slice(0, dash) : base.replace(/\.png$/i, '');
}

function captureCommandHint() {
  return 'npm run ios:screenshots:faster';
}

module.exports = {
  platform: 'ios',
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
