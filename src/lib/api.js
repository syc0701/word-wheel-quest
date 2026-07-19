import { getOrCreateWordWheelSession, getWordWheelSession, clearWordWheelSession } from './session';
import { clearGuestPuzzleCoins } from './guestCoinsStorage';
import { isLoggedIn } from './auth';
import { apiGet, apiPost, apiPut } from './http';

async function getSessionForRequest() {
  const loggedIn = await isLoggedIn();
  if (loggedIn) {
    return { session: await getWordWheelSession(), loggedIn: true };
  }
  return { session: await getOrCreateWordWheelSession(), loggedIn: false };
}

function clearSessionAfterLoginMigration(loggedIn, session) {
  if (loggedIn && session?.sessionId) {
    clearWordWheelSession();
    clearGuestPuzzleCoins();
  }
}

const WordWheelApi = {
  fetchNext: async () => {
    const { session, loggedIn } = await getSessionForRequest();
    const data = await apiGet(
      '/v1/puzzle/wordwheel/next',
      session ? { sessionId: session.sessionId } : undefined
    );
    if (__DEV__) {
      console.log('[WordWheelApi] fetchNext', {
        loggedIn,
        sessionId: session?.sessionId,
        code: data?.code,
        id: data?.id,
        title: data?.title,
        wordsTotal: data?.wordsTotal,
        puzzleLevel: data?.puzzleLevel ?? data?.mainJourneyLevel,
      });
    }
    clearSessionAfterLoginMigration(loggedIn, session);
    return data;
  },

  fetchDaily: async (date) => {
    const { session, loggedIn } = await getSessionForRequest();
    const param = {};
    if (session) param.sessionId = session.sessionId;
    if (date) param.date = date;
    const data = await apiGet(
      '/v1/puzzle/wordwheel/daily',
      Object.keys(param).length > 0 ? param : undefined
    );
    clearSessionAfterLoginMigration(loggedIn, session);
    return data;
  },

  fetchJourneyLevel: async (level, season) => {
    const param = { level: String(level) };
    if (season) param.season = season;
    return apiGet('/v1/puzzle/wordwheel/journey', param);
  },

  startPlay: async (wordWheelTplId) => {
    const { session, loggedIn } = await getSessionForRequest();
    const payload = { wordWheelTplId };
    if (session) {
      payload.sessionId = session.sessionId;
      payload.sessionCreatedAt = session.createdAt;
    }
    const data = await apiPost('/v1/puzzle/wordwheel-play/start', payload);
    clearSessionAfterLoginMigration(loggedIn, session);
    return data;
  },

  updateProgress: async (wordWheelTplId, foundWords, bonusWords) => {
    const { session, loggedIn } = await getSessionForRequest();
    const payload = { wordWheelTplId, foundWords };
    if (Array.isArray(bonusWords)) {
      payload.bonusWords = bonusWords;
    }
    if (session) payload.sessionId = session.sessionId;
    const data = await apiPut('/v1/puzzle/wordwheel-play/progress', payload);
    clearSessionAfterLoginMigration(loggedIn, session);
    return data;
  },

  fetchCoinsCatalog: () => apiGet('/v1/puzzle/wordwheel/coins-catalog'),
};

export default WordWheelApi;
