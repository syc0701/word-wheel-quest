import { apiGet } from './http';

export const WORD_WHEEL_PUZZLE_TYPE = 'WORD_WHEEL';

/**
 * Current user's Word Wheel leaderboard standing.
 * Score is cumulative words found (`wordsFound`). Guests / no rows → null.
 */
export async function fetchMyWordWheelStanding() {
  const data = await apiGet('/home/leader-board/me', {
    puzzleType: WORD_WHEEL_PUZZLE_TYPE,
  });
  if (!data || data.code === 'NO_DATA' || data.code === 'FAILURE') {
    return null;
  }
  const wordsFound = Number(data.wordsFound);
  const rank = data.rank != null ? Number(data.rank) : null;
  return {
    wordsFound: Number.isFinite(wordsFound) ? wordsFound : 0,
    rank: Number.isFinite(rank) ? rank : null,
    puzzleType: data.puzzleType || WORD_WHEEL_PUZZLE_TYPE,
    updatedAt: data.updatedAt ?? null,
  };
}
