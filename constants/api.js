/** API host — localhost for local puzzle-be testing; production otherwise. */
export const API_BASE_URL = __DEV__
  ? 'http://localhost:8080'
  : 'https://www.puzzleinteract.com';

export const WORD_WHEEL_DAILY_CALENDAR_MIN = '2026-04-01';
export const WORD_WHEEL_DAILY_EPOCH = '2026-01-01';
export const DEFAULT_SEASON = 'season_2026';
