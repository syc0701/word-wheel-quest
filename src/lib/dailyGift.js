import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ww.dailyGift.v1';

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Local calendar day, not UTC. */
export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function previousDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
}

function emptyRecord() {
  return { lastClaimDate: '', streak: 0, todayCoins: 0, lifetime: 0, iconShownDate: '' };
}

function coinsForStreak(streak) {
  return streak >= 2 ? 3 : 2;
}

export async function loadDailyGift() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyRecord();
    const parsed = JSON.parse(raw);
    return {
      lastClaimDate: typeof parsed.lastClaimDate === 'string' ? parsed.lastClaimDate : '',
      streak: Math.max(0, Math.floor(Number(parsed.streak) || 0)),
      todayCoins: Math.max(0, Math.floor(Number(parsed.todayCoins) || 0)),
      lifetime: Math.max(0, Math.floor(Number(parsed.lifetime) || 0)),
      iconShownDate: typeof parsed.iconShownDate === 'string' ? parsed.iconShownDate : '',
    };
  } catch {
    return emptyRecord();
  }
}

/** What the next claim would grant, or today's claim if already taken. */
export function describeDailyGift(record, today = localDateKey()) {
  if (record.lastClaimDate === today) {
    return {
      claimed: true,
      coins: record.todayCoins,
      streak: record.streak,
      lifetime: record.lifetime,
    };
  }
  const streak = record.lastClaimDate === previousDateKey(today) ? record.streak + 1 : 1;
  return {
    claimed: false,
    coins: coinsForStreak(streak),
    streak,
    lifetime: record.lifetime,
  };
}

export async function claimDailyGift(today = localDateKey()) {
  const record = await loadDailyGift();
  const preview = describeDailyGift(record, today);
  if (preview.claimed) {
    return { ...preview, already: true };
  }
  const next = {
    lastClaimDate: today,
    streak: preview.streak,
    todayCoins: preview.coins,
    lifetime: record.lifetime + preview.coins,
    iconShownDate: record.iconShownDate || today,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return {
    claimed: true,
    already: false,
    coins: next.todayCoins,
    streak: next.streak,
    lifetime: next.lifetime,
  };
}

/** The home gift icon is shown once per local day. */
export async function markGiftIconShown(today = localDateKey()) {
  const record = await loadDailyGift();
  if (record.iconShownDate === today) return record;
  const next = { ...record, iconShownDate: today };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
