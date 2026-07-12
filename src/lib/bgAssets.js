import AsyncStorage from '@react-native-async-storage/async-storage';

export const WEEKLY_BG_KEY = 'ww.bg.weekly';

/** All scene backgrounds available for the Random theme. */
export const BG_IMAGE_CATALOG = {
  beach: require('../assets/bg_image/beach.png'),
  deep_sea: require('../assets/bg_image/deep_sea.png'),
  mountain: require('../assets/bg_image/mountain.png'),
  road: require('../assets/bg_image/road.png'),
};

export const BG_IMAGE_IDS = Object.keys(BG_IMAGE_CATALOG);

/** ISO-like week key: `2026-W28` — same image stays for the whole week. */
export function getWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function pickRandomId(excludeId) {
  const pool =
    excludeId && BG_IMAGE_IDS.length > 1
      ? BG_IMAGE_IDS.filter((id) => id !== excludeId)
      : BG_IMAGE_IDS;
  return pool[Math.floor(Math.random() * pool.length)] || BG_IMAGE_IDS[0];
}

/**
 * Returns `{ id, source, week }` for this calendar week.
 * Picks a new random scene when the week rolls over.
 */
export async function resolveWeeklyBackground() {
  const week = getWeekKey();
  let previousId = null;

  try {
    const raw = await AsyncStorage.getItem(WEEKLY_BG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      previousId = parsed?.id || null;
      if (parsed?.week === week && parsed?.id && BG_IMAGE_CATALOG[parsed.id]) {
        return {
          id: parsed.id,
          source: BG_IMAGE_CATALOG[parsed.id],
          week,
        };
      }
    }
  } catch {
    /* ignore */
  }

  const id = pickRandomId(previousId);
  const payload = { week, id };
  try {
    await AsyncStorage.setItem(WEEKLY_BG_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }

  return {
    id,
    source: BG_IMAGE_CATALOG[id],
    week,
  };
}
