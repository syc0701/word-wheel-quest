import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Scene backgrounds for Image appearance.
 * Order matters: band 0 is the first journey scene (popcorn).
 * New 260820 set is listed first; legacy JPGs follow. PNGs removed.
 */
export const BG_IMAGE_CATALOG = {
  circus_popcorn: require('../assets/bg_image/260820-circus-popcorn-and-juggling-pins.jpeg'),
  morning_espresso: require('../assets/bg_image/260820-morning-espresso-and-lavender-view.jpeg'),
  vermont_autumn: require('../assets/bg_image/260820-vermont-autumn-farmland-at-dusk.jpeg'),
  soccer_stadium: require('../assets/bg_image/260820-soccer-ball-on-stadium-turf.jpeg'),
  study_chalkboard: require('../assets/bg_image/260820-classic-study-corner-with-chalkboard.jpeg'),
  vintage_console: require('../assets/bg_image/260820-vintage-zenith-console-and-color-bars.jpeg'),
  beach: require('../assets/bg_image/beach.jpg'),
  deep_sea: require('../assets/bg_image/deep_sea.jpg'),
  flowers: require('../assets/bg_image/flowers.jpg'),
  island: require('../assets/bg_image/island.jpg'),
  mountain: require('../assets/bg_image/mountain.jpg'),
  road: require('../assets/bg_image/road.jpg'),
  tropical_island: require('../assets/bg_image/tropical_island.jpg'),
  urban: require('../assets/bg_image/urban.jpg'),
  village: require('../assets/bg_image/village.jpg'),
};

/** Explicit order — do not alphabetize (popcorn must stay first). */
export const BG_IMAGE_IDS = Object.keys(BG_IMAGE_CATALOG);

/** First-launch / splash background (circus popcorn). */
export const SPLASH_BG_SOURCE = BG_IMAGE_CATALOG.circus_popcorn;

/** Scene changes at levels 50, 100, 150, … */
export const LEVELS_PER_SCENE = 50;

const SCENE_LEVEL_KEY = 'ww.sceneJourneyLevel.v1';

/**
 * Band index for journey level: 1–49 → 0, 50–99 → 1, 100–149 → 2, …
 */
export function getSceneBandForLevel(level) {
  const n = Number(level);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n / LEVELS_PER_SCENE);
}

/**
 * Returns `{ id, source, band, level }` for the current journey level band.
 * Cycles through every catalog image in order.
 */
export function resolveSceneBackground(level = 0) {
  const band = getSceneBandForLevel(level);
  const id = BG_IMAGE_IDS[band % BG_IMAGE_IDS.length] || BG_IMAGE_IDS[0];
  return {
    id,
    source: BG_IMAGE_CATALOG[id],
    band,
    level: Number(level) || 0,
  };
}

/** Home / main hub always uses the circus popcorn scene. */
export function resolveHomeBackground(level = 0) {
  return {
    id: 'circus_popcorn',
    source: BG_IMAGE_CATALOG.circus_popcorn,
    band: getSceneBandForLevel(level),
    level: Number(level) || 0,
  };
}

/**
 * Play uses a different image than home — cycles the catalog excluding popcorn
 * so the board never shares the main-page photo.
 */
export function resolvePlayBackground(level = 0) {
  const band = getSceneBandForLevel(level);
  const playIds = BG_IMAGE_IDS.filter((id) => id !== 'circus_popcorn');
  const list = playIds.length ? playIds : BG_IMAGE_IDS;
  const id = list[band % list.length] || list[0];
  return {
    id,
    source: BG_IMAGE_CATALOG[id],
    band,
    level: Number(level) || 0,
  };
}

export async function loadStoredSceneLevel() {
  try {
    const raw = await AsyncStorage.getItem(SCENE_LEVEL_KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export async function saveStoredSceneLevel(level) {
  const n = Number(level);
  if (!Number.isFinite(n) || n <= 0) return;
  try {
    await AsyncStorage.setItem(SCENE_LEVEL_KEY, String(Math.floor(n)));
  } catch {
    // best-effort
  }
}

/** @deprecated Prefer {@link resolveSceneBackground}. */
export async function resolveWeeklyBackground() {
  const level = await loadStoredSceneLevel();
  return resolveSceneBackground(level);
}
