import { apiGet, apiPut } from './http';

export const WORD_WHEEL_PUZZLE_TYPE = 'WORD_WHEEL';

/**
 * Current user's Word Wheel leaderboard standing.
 * Score is cumulative words found (`score`). Guests / no rows → null.
 */
function readStanding(data) {
  if (!data || data.code === 'NO_DATA' || data.code === 'FAILURE') return null;
  const score = Number(data.score);
  const rank = data.rank != null ? Number(data.rank) : null;
  const nickname = typeof data.nickname === 'string' ? data.nickname.trim() : '';
  return {
    score: Number.isFinite(score) ? score : 0,
    rank: Number.isFinite(rank) ? rank : null,
    nickname: nickname || 'Player',
    puzzleType: data.puzzleType || WORD_WHEEL_PUZZLE_TYPE,
    updatedAt: data.updatedAt ?? null,
  };
}

export async function fetchMyWordWheelStanding() {
  const data = await apiGet('/home/leader-board/me', {
    puzzleType: WORD_WHEEL_PUZZLE_TYPE,
  });
  return readStanding(data);
}

/** Public leaderboard name. Signed-in only. */
export async function updateWordWheelNickname(nickname) {
  const data = await apiPut('/home/user/nickname', { nickname });
  if (data?.code === 'FAILURE') {
    throw new Error(data.message || 'Could not save nickname');
  }
  return data;
}

/** Top Word Wheel standings. Score is lifetime words found. */
export async function fetchWordWheelTopStandings(limit = 10) {
  const data = await apiGet('/home/leader-board', {
    page: 0,
    pageSize: limit,
    puzzleType: WORD_WHEEL_PUZZLE_TYPE,
  });
  if (!data || data.code === 'NO_DATA' || data.code === 'FAILURE') return [];
  const rows = Array.isArray(data) ? data : (data.content || []);
  return rows.slice(0, limit).map((row, index) => {
    const standing = readStanding(row);
    if (!standing) return null;
    return {
      ...standing,
      rank: standing.rank ?? index + 1,
    };
  }).filter(Boolean);
}
