import AsyncStorage from '@react-native-async-storage/async-storage';

/** All scene backgrounds available for the Image appearance. */
export const BG_IMAGE_CATALOG = {
  '0804_flower': require('../assets/bg_image/0804-flower.png'),
  '0804_mountain': require('../assets/bg_image/0804-mountain.png'),
  '0804_plant': require('../assets/bg_image/0804-plant.png'),
  beach: require('../assets/bg_image/beach.jpg'),
  classroom: require('../assets/bg_image/classroom.png'),
  deep_sea: require('../assets/bg_image/deep_sea.jpg'),
  flowers: require('../assets/bg_image/flowers.jpg'),
  island: require('../assets/bg_image/island.jpg'),
  mountain: require('../assets/bg_image/mountain.jpg'),
  road: require('../assets/bg_image/road.jpg'),
  tropical_island: require('../assets/bg_image/tropical_island.jpg'),
  urban: require('../assets/bg_image/urban.jpg'),
  village: require('../assets/bg_image/village.jpg'),
};

/** Stable alphabetical order so level bands stay deterministic. */
export const BG_IMAGE_IDS = Object.keys(BG_IMAGE_CATALOG).sort();

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
