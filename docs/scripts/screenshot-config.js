/**
 * Play Store phone screenshot config for Word Wheel Quest.
 * Captures https://www.puzzleinteract.com/prototype/mobile/word-wheel/screenshot/01 … /10
 * into fastlane/metadata/android/<locale>/images/phoneScreenshots/
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

/** Match existing puzzle-app Play phoneScreenshots: 1080×1920 */
const PHONE = {
  name: 'phone',
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
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
  if (!raw) {
    // Default: only locales that already have metadata text
    return LOCALES.filter(({ locale }) => locale === 'en-US');
  }
  const wanted = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const filtered = LOCALES.filter(({ locale }) => wanted.includes(locale));
  if (filtered.length === 0) {
    throw new Error(
      `SNAPSHOT_LANGUAGES matched nothing. Use: ${LOCALES.map((l) => l.locale).join(', ')}`
    );
  }
  return filtered;
}

function screenshotsRoot() {
  return path.join(__dirname, '..', '..', 'fastlane', 'metadata', 'android');
}

function phoneScreenshotsDir(locale) {
  return path.join(screenshotsRoot(), locale, 'images', 'phoneScreenshots');
}

module.exports = {
  BASE_URL,
  LOCALES,
  PHONE,
  SCENE_START,
  SCENE_END,
  padScene,
  sceneSlugs,
  buildSceneUrl,
  parseLocaleFilter,
  screenshotsRoot,
  phoneScreenshotsDir,
};
