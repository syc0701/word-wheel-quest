/**
 * Play Store screenshot config for Word Wheel Quest.
 * Captures https://www.puzzleinteract.com/prototype/mobile/word-wheel/screenshot/01 … /08
 * into fastlane/metadata/android/<locale>/images/{phone,sevenInch}Screenshots/
 */

const path = require('path');

const BASE_URL =
  process.env.SCREENSHOT_BASE_URL ??
  'https://www.puzzleinteract.com/prototype/mobile/word-wheel/screenshot';

/** Play Console locale folder → ?lang= code */
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

/** Match puzzle-app Play screenshot sizes */
const DEVICES = {
  phone: {
    name: 'phone',
    playFolder: 'phoneScreenshots',
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  },
  sevenInch: {
    name: 'sevenInch',
    playFolder: 'sevenInchScreenshots',
    viewport: { width: 1200, height: 1920 },
    deviceScaleFactor: 1,
  },
  tenInch: {
    name: 'tenInch',
    playFolder: 'tenInchScreenshots',
    viewport: { width: 1600, height: 2560 },
    deviceScaleFactor: 1,
  },
};

const SCENE_START = Number(process.env.SCREENSHOT_START ?? 1);
const SCENE_END = Number(process.env.SCREENSHOT_END ?? 8);

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

function screenshotsDir(locale, playFolder) {
  return path.join(screenshotsRoot(), locale, 'images', playFolder);
}

/** @deprecated use screenshotsDir(locale, 'phoneScreenshots') */
function phoneScreenshotsDir(locale) {
  return screenshotsDir(locale, 'phoneScreenshots');
}

module.exports = {
  BASE_URL,
  LOCALES,
  DEVICES,
  /** @deprecated use DEVICES.phone */
  PHONE: DEVICES.phone,
  SCENE_START,
  SCENE_END,
  padScene,
  sceneSlugs,
  buildSceneUrl,
  parseLocaleFilter,
  parseDeviceFilter,
  screenshotsRoot,
  screenshotsDir,
  phoneScreenshotsDir,
};
