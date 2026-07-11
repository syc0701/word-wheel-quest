/**
 * App Store screenshot config — mirrors puzzle-app Snapfile + Fastfile defaults.
 * 10 locales × 2 devices × 10 scenes = 200 PNGs per full run.
 */

const BASE_URL =
  process.env.SCREENSHOT_BASE_URL ??
  'https://www.puzzleinteract.com/prototype/mobile/word-wheel/screenshot';

/** Fastlane / App Store Connect locale → short ?lang= code (see puzzle-app screenshotI18n.js). */
const LOCALES = [
  { locale: 'en-US', lang: 'en' },
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

/** App Store display slots — same simulators as puzzle-app Fastfile. */
const DEVICES = [
  {
    name: 'iPhone 15 Plus',
    playwrightPreset: 'iPhone 15 Plus',
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    pixelSize: '1290×2796',
  },
  {
    name: 'iPad Pro 13-inch (M4)',
    playwrightPreset: 'iPad Pro 11',
    viewport: { width: 1032, height: 1376 },
    deviceScaleFactor: 2,
    pixelSize: '2064×2752',
  },
];

const SCENE_START = Number(process.env.SCREENSHOT_START ?? 1);
const SCENE_END = Number(process.env.SCREENSHOT_END ?? 10);

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

function snapshotName(slug) {
  return `${slug}WordWheel-Screenshot-${slug}`;
}

function buildSceneUrl(slug, lang) {
  return `${BASE_URL}/${slug}?lang=${lang}`;
}

function parseLocaleFilter() {
  const raw = process.env.SNAPSHOT_LANGUAGES?.trim();
  if (!raw) return LOCALES;
  const wanted = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const filtered = LOCALES.filter(({ locale }) => wanted.includes(locale));
  if (filtered.length === 0) {
    throw new Error(`SNAPSHOT_LANGUAGES matched nothing. Use: ${LOCALES.map((l) => l.locale).join(', ')}`);
  }
  return filtered;
}

function parseDeviceFilter() {
  if (process.env.SNAPSHOT_IPHONE_ONLY === '1') {
    return DEVICES.filter((d) => d.name.startsWith('iPhone'));
  }

  const raw = process.env.SNAPSHOT_DEVICES?.trim();
  if (!raw) return DEVICES;

  const wanted = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const filtered = DEVICES.filter(({ name }) =>
    wanted.some((w) => name === w || name.startsWith(w))
  );
  if (filtered.length === 0) {
    throw new Error(`SNAPSHOT_DEVICES matched nothing. Use: ${DEVICES.map((d) => d.name).join(', ')}`);
  }
  return filtered;
}

function screenshotsRoot() {
  return require('path').join(__dirname, '..', '..', 'ios', 'fastlane', 'screenshots');
}

module.exports = {
  BASE_URL,
  LOCALES,
  DEVICES,
  SCENE_START,
  SCENE_END,
  padScene,
  sceneSlugs,
  snapshotName,
  buildSceneUrl,
  parseLocaleFilter,
  parseDeviceFilter,
  screenshotsRoot,
};
