/**
 * Between-level intermission screen types (Policy Pattern).
 * Values are the visual state ids consumed by LevelIntermissionManager.
 */
export const LEVEL_SCREEN_TYPES = {
  WORD_MASTER: 'word-master',
  STREAKS_SPARKS: 'streaks-sparks',
  BRAIN_POWER: 'brain-power',
};

/**
 * Picks the intermission variant from level outcomes.
 *
 * Rules (priority order):
 * 1. Mod 10 level → major chapter / BRAIN_POWER
 * 2. Session streak mod 3 (when streak > 0) OR time under 40s → STREAKS_SPARKS
 * 3. Otherwise → WORD_MASTER
 */
export const LevelScreenPolicy = {
  determineScreenType({ levelNumber, timeSpentSeconds, sessionStreak }) {
    const level = Number(levelNumber) || 0;
    const seconds = Number(timeSpentSeconds);
    const streak = Number(sessionStreak) || 0;

    if (level > 0 && level % 10 === 0) {
      return LEVEL_SCREEN_TYPES.BRAIN_POWER;
    }

    const sparkStreak = streak > 0 && streak % 3 === 0;
    const fastClear = Number.isFinite(seconds) && seconds < 40;
    if (sparkStreak || fastClear) {
      return LEVEL_SCREEN_TYPES.STREAKS_SPARKS;
    }

    return LEVEL_SCREEN_TYPES.WORD_MASTER;
  },
};
