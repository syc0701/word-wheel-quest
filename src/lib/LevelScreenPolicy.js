/**
 * Between-level completion dialog / intermission types (Policy Pattern).
 * Values are the visual state ids consumed by LevelIntermissionManager
 * and WordWheelCompleteDialog.
 */
export const LEVEL_SCREEN_TYPES = {
  WORD_MASTER: 'WORD_MASTER',
  STREAK_SPARKS: 'STREAK_SPARKS',
  BRAIN_POWER: 'BRAIN_POWER',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
};

/** @deprecated Use STREAK_SPARKS */
export const STREAKS_SPARKS_ALIAS = LEVEL_SCREEN_TYPES.STREAK_SPARKS;

/** Season journey catalog / Word Master end level. */
export const MAX_JOURNEY_LEVEL = 1100;

/** Extra coins on top of regular word-length rewards. */
export const MILESTONE_BONUS_COINS = {
  [LEVEL_SCREEN_TYPES.STREAK_SPARKS]: 10,
  [LEVEL_SCREEN_TYPES.BRAIN_POWER]: 5,
  [LEVEL_SCREEN_TYPES.WORD_MASTER]: 0,
  [LEVEL_SCREEN_TYPES.LEVEL_COMPLETE]: 0,
};

/**
 * Picks the completion popup from journey level.
 *
 * Priority:
 * 1. Max journey level → Word Master
 * 2. Multiples of 100 (not max) → Streak Sparks (+10)
 * 3. Multiples of 10 (not 100s) → Brain Power (+5)
 * 4. Otherwise → standard Level Complete
 */
export const LevelScreenPolicy = {
  determineScreenType({ levelNumber }) {
    const level = Number(levelNumber) || 0;
    if (level === MAX_JOURNEY_LEVEL) {
      return LEVEL_SCREEN_TYPES.WORD_MASTER;
    }
    if (level > 0 && level % 100 === 0) {
      return LEVEL_SCREEN_TYPES.STREAK_SPARKS;
    }
    if (level > 0 && level % 10 === 0) {
      return LEVEL_SCREEN_TYPES.BRAIN_POWER;
    }
    return LEVEL_SCREEN_TYPES.LEVEL_COMPLETE;
  },

  resolveBonusCoins(levelNumber) {
    const type = this.determineScreenType({ levelNumber });
    return MILESTONE_BONUS_COINS[type] ?? 0;
  },
};
