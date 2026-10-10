import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Scene backgrounds for Image appearance.
 * The cottage is the home screen only. The rest, including the old home photo,
 * rotate on the play screen every 5 levels.
 */
export const HOME_BG_ID = 'cottage_peonies';

export const BG_IMAGE_CATALOG = {
  cottage_peonies: require('../assets/bg_image/261009-cottage-with-lilac-shutters-and-peonies.jpeg'),
  wellness_corner: require('../assets/bg_image/260919-wellness-corner-with-aloe-and-water.jpeg'),
  morning_espresso: require('../assets/bg_image/260820-morning-espresso-and-lavender-view.webp'),
  vermont_autumn: require('../assets/bg_image/260820-vermont-autumn-farmland-at-dusk.webp'),
  soccer_stadium: require('../assets/bg_image/260820-soccer-ball-on-stadium-turf.webp'),
  study_chalkboard: require('../assets/bg_image/260820-classic-study-corner-with-chalkboard.webp'),
  vintage_console: require('../assets/bg_image/260820-vintage-zenith-console-and-color-bars.webp'),
  beach: require('../assets/bg_image/beach.webp'),
  flowers: require('../assets/bg_image/flowers.webp'),
  island: require('../assets/bg_image/island.webp'),
  road: require('../assets/bg_image/road.webp'),
  tropical_island: require('../assets/bg_image/tropical_island.webp'),
};

/** Explicit order — do not alphabetize. Home photo stays first and is excluded from play. */
export const BG_IMAGE_IDS = Object.keys(BG_IMAGE_CATALOG);

/** First-launch / splash background (same photo as the home screen). */
export const SPLASH_BG_SOURCE = BG_IMAGE_CATALOG[HOME_BG_ID];

/** Scene changes at levels 5, 10, 15, 20, 25, … */
export const LEVELS_PER_SCENE = 5;

/** Pack play photos. Master alternates the two images every 5 levels. */
const PACK_PLAY_IMAGES = {
  classic: [
    require('../assets/pack_image/260929-sailboat-sand-mold-in-sunny-sandbox.jpeg'),
  ],
  master: [
    require('../assets/pack_image/260929-jade-and-echeveria-morning-light.jpeg'),
    require('../assets/pack_image/260929-moonstone-and-bloodstone-chess-match.jpeg'),
  ],
};

/** Backdrop for a paid pack, or null for the free journey and Hard Quest. */
export function resolvePackPlayBackground(packCode, level = 1) {
  const list = PACK_PLAY_IMAGES[packCode];
  if (!list?.length) return null;
  const band = getSceneBandForLevel(level);
  return {
    id: packCode,
    source: list[band % list.length],
    band,
    level: Number(level) || 0,
  };
}

const SCENE_LEVEL_KEY = 'ww.sceneJourneyLevel.v1';

/**
 * Band index for journey level: 1–4 → 0, 5–9 → 1, 10–14 → 2, …
 */
export function getSceneBandForLevel(level) {
  const n = Number(level);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n / LEVELS_PER_SCENE);
}

/**
 * Returns `{ id, source, band, level }` for the current journey level band.
 * Same rotation as play: every catalog photo except the home image.
 */
export function resolveSceneBackground(level = 0) {
  return resolvePlayBackground(level);
}

/** Home / main hub always uses the cottage scene. */
export function resolveHomeBackground(level = 0) {
  return {
    id: HOME_BG_ID,
    source: BG_IMAGE_CATALOG[HOME_BG_ID],
    band: getSceneBandForLevel(level),
    level: Number(level) || 0,
  };
}

/**
 * Play cycles the catalog except the home photo, so the board never shares
 * the main-page image. The previous home photo is the first rotating scene.
 */
export function resolvePlayBackground(level = 0) {
  const band = getSceneBandForLevel(level);
  const playIds = BG_IMAGE_IDS.filter((id) => id !== HOME_BG_ID);
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
