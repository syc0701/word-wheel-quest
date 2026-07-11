import { t } from './i18n';

export function parseWordWheelCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object') {
    return [];
  }
  return Object.entries(catalog)
    .map(([length, coins]) => ({
      length: Number(length),
      coins: Number(coins),
    }))
    .filter((row) => Number.isFinite(row.length) && Number.isFinite(row.coins))
    .sort((a, b) => a.length - b.length);
}

export function formatWordWheelPlayDuration(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return t('duration.lessThanMinute');
  const ms = Number(finishedAt) - Number(startedAt);
  if (!Number.isFinite(ms) || ms < 60000) return t('duration.lessThanMinute');
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0
      ? t('duration.hoursMinutes', { hrs, rem })
      : t('duration.hours', { hrs });
  }
  return secs > 0
    ? t('duration.minutesSeconds', { mins, secs })
    : t('duration.minutes', { mins });
}

/** Coins (or credits) charged to reveal one empty letter. */
export const WORD_WHEEL_HINT_COST = 1;

export function resolveWordWheelCoinsForWord(word, catalogRows) {
  const len = (word || '').trim().length;
  if (!len || !Array.isArray(catalogRows) || catalogRows.length === 0) {
    return 0;
  }
  const exact = catalogRows.find((row) => row.length === len);
  if (exact) return exact.coins;
  const capped = [...catalogRows].filter((row) => row.length <= len).sort((a, b) => b.length - a.length)[0];
  return capped?.coins ?? 0;
}

export function sumWordWheelCoinsForWords(words, catalogRows) {
  if (!Array.isArray(words)) return 0;
  return words.reduce((sum, word) => sum + resolveWordWheelCoinsForWord(word, catalogRows), 0);
}

export function readCoinsEarned(playSession) {
  const earned = playSession?.coinsEarned;
  return Number.isFinite(Number(earned)) ? Number(earned) : 0;
}

export function readTotalPuzzleCoinsFromPlay(playSession) {
  const total = playSession?.totalPuzzleCoins;
  return Number.isFinite(Number(total)) ? Number(total) : null;
}
