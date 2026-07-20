/** All scene backgrounds available for the Image appearance. */
export const BG_IMAGE_CATALOG = {
  beach: require('../assets/bg_image/beach.jpg'),
  classroom: require('../assets/bg_image/classroom.jpg'),
  deep_sea: require('../assets/bg_image/deep_sea.jpg'),
  flowers: require('../assets/bg_image/flowers.jpg'),
  island: require('../assets/bg_image/island.jpg'),
  mountain: require('../assets/bg_image/mountain.jpg'),
  road: require('../assets/bg_image/road.jpg'),
  tropical_island: require('../assets/bg_image/tropical_island.jpg'),
  urban: require('../assets/bg_image/urban.jpg'),
  village: require('../assets/bg_image/village.jpg'),
};

/** Stable alphabetical order so the 3-day rotation stays deterministic. */
export const BG_IMAGE_IDS = Object.keys(BG_IMAGE_CATALOG).sort();

const DAYS_PER_SCENE = 3;
const MS_PER_DAY = 86400000;

/** Epoch-day bucket: each scene stays visible for {@link DAYS_PER_SCENE} days. */
export function getScenePeriodIndex(date = new Date()) {
  const utcDay = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY
  );
  return Math.floor(utcDay / DAYS_PER_SCENE);
}

export function getScenePeriodKey(date = new Date()) {
  return `P${getScenePeriodIndex(date)}`;
}

/**
 * Returns `{ id, source, period }` for the current 3-day window.
 * Cycles through every catalog image in order.
 */
export function resolveSceneBackground(date = new Date()) {
  const period = getScenePeriodIndex(date);
  const id = BG_IMAGE_IDS[period % BG_IMAGE_IDS.length] || BG_IMAGE_IDS[0];
  return {
    id,
    source: BG_IMAGE_CATALOG[id],
    period,
    periodKey: getScenePeriodKey(date),
  };
}

/** @deprecated Prefer {@link resolveSceneBackground}. */
export async function resolveWeeklyBackground() {
  return resolveSceneBackground();
}
