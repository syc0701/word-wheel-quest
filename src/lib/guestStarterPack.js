import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FREE_DAILY_PLAYS,
  GUEST_MAX_LEVEL_WITHOUT_STARTER,
  GRANDFATHER_EXCEPTION_MIN_LEVEL,
  GRANDFATHER_MAX_LEVEL_WITHOUT_STARTER,
  PUZZLE_PLAY_CREDIT_COST,
  STARTER_PACK_PACKAGE_ID,
  STARTER_PACK_PRODUCT_ID,
  STARTER_PACK_PUZZLE_CREDITS,
} from '../constants/guestAccess';
import { loadPendingIap } from './pendingIap';
import CreditApi from './creditApi';
import { APP_STORE } from '../constants/store';

const STARTER_PACK_KEY = 'ww.starter_pack';
const FREE_DAILY_PLAYS_KEY = 'ww.free_daily_plays_used';
const GUEST_PUZZLE_CREDITS_KEY = 'ww.guest_puzzle_credits';

function isStarterPurchase(record) {
  if (!record) return false;
  return (
    record.packageKey === STARTER_PACK_PACKAGE_ID
    || record.productId === STARTER_PACK_PRODUCT_ID
  );
}

export async function hasStarterPackLocal() {
  try {
    const raw = await AsyncStorage.getItem(STARTER_PACK_KEY);
    if (raw === '1') return true;
  } catch {
    /* ignore */
  }
  const pending = await loadPendingIap();
  return isStarterPurchase(pending);
}

/** @deprecated alias */
export const hasGuestStarterPackLocal = hasStarterPackLocal;

/** Starter pack purchased locally (guest or signed-in). No sign-in bypass. */
export async function hasStarterPackAccess() {
  return hasStarterPackLocal();
}

export async function markStarterPackPurchased({ grantGuestCredits = true } = {}) {
  try {
    await AsyncStorage.setItem(STARTER_PACK_KEY, '1');
  } catch {
    /* ignore */
  }
  if (grantGuestCredits) {
    try {
      const raw = await AsyncStorage.getItem(GUEST_PUZZLE_CREDITS_KEY);
      const current = Number(raw);
      if (!Number.isFinite(current) || current <= 0) {
        await AsyncStorage.setItem(GUEST_PUZZLE_CREDITS_KEY, String(STARTER_PACK_PUZZLE_CREDITS));
      }
    } catch {
      /* ignore */
    }
  }
}

/** @deprecated */
export const markGuestStarterPackPurchased = markStarterPackPurchased;

export async function getFreeDailyPlaysUsed() {
  try {
    const raw = await AsyncStorage.getItem(FREE_DAILY_PLAYS_KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export async function getFreeDailyPlaysRemaining() {
  const used = await getFreeDailyPlaysUsed();
  return Math.max(0, FREE_DAILY_PLAYS - used);
}

export async function incrementFreeDailyPlaysUsed() {
  const used = await getFreeDailyPlaysUsed();
  const next = Math.min(FREE_DAILY_PLAYS, used + 1);
  try {
    await AsyncStorage.setItem(FREE_DAILY_PLAYS_KEY, String(next));
  } catch {
    /* ignore */
  }
  return next;
}

export async function getGuestPuzzleCredits() {
  try {
    const raw = await AsyncStorage.getItem(GUEST_PUZZLE_CREDITS_KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export async function consumeGuestPuzzleCredits(amount = PUZZLE_PLAY_CREDIT_COST) {
  const cost = Math.max(1, Number(amount) || PUZZLE_PLAY_CREDIT_COST);
  const current = await getGuestPuzzleCredits();
  if (current < cost) return { ok: false, balance: current };
  const next = current - cost;
  try {
    await AsyncStorage.setItem(GUEST_PUZZLE_CREDITS_KEY, String(next));
  } catch {
    return { ok: false, balance: current };
  }
  return { ok: true, balance: next };
}

export function normalizeJourneyLevel(level) {
  const n = Number(level);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

/** Last journey level playable without starter (50 default; 59 if already at level 56+). */
export function resolveMaxLevelWithoutStarter(playerJourneyLevel) {
  const current = normalizeJourneyLevel(playerJourneyLevel);
  if (current != null && current >= GRANDFATHER_EXCEPTION_MIN_LEVEL) {
    return GRANDFATHER_MAX_LEVEL_WITHOUT_STARTER;
  }
  return GUEST_MAX_LEVEL_WITHOUT_STARTER;
}

/** First gated journey level for this player's saved progress. */
export function resolveStarterUnlockLevel(playerJourneyLevel) {
  return resolveMaxLevelWithoutStarter(playerJourneyLevel) + 1;
}

export function guestCanPlayJourneyLevel(level, hasStarter, playerJourneyLevel) {
  const n = normalizeJourneyLevel(level);
  if (n == null) return true;
  const maxFree = resolveMaxLevelWithoutStarter(playerJourneyLevel ?? level);
  if (n <= maxFree) return true;
  return hasStarter;
}

export function guestNeedsStarterToContinue(completedLevel, hasStarter, playerJourneyLevel) {
  const n = normalizeJourneyLevel(completedLevel);
  if (n == null || hasStarter) return false;
  const maxFree = resolveMaxLevelWithoutStarter(playerJourneyLevel ?? completedLevel);
  return n >= maxFree;
}

export function journeyLevelNeedsCredit(level, playerJourneyLevel) {
  const n = normalizeJourneyLevel(level);
  if (n == null) return false;
  const maxFree = resolveMaxLevelWithoutStarter(playerJourneyLevel ?? level);
  return n > maxFree;
}

/**
 * Journey play access for a specific level (e.g. user at level 56 on Home).
 * @returns {'free'|'starter'|'no_credits'|'credit'}
 */
export async function resolveJourneyPlayAccess(journeyLevel, {
  hasStarter,
  loggedIn,
  creditBalance = 0,
  playerJourneyLevel = null,
}) {
  const n = normalizeJourneyLevel(journeyLevel);
  const progress = normalizeJourneyLevel(playerJourneyLevel) ?? n;
  const maxFree = resolveMaxLevelWithoutStarter(progress);
  if (n == null || n <= maxFree) return 'free';
  if (!hasStarter) return 'starter';
  if (loggedIn) {
    return creditBalance >= PUZZLE_PLAY_CREDIT_COST ? 'credit' : 'no_credits';
  }
  const guestCredits = await getGuestPuzzleCredits();
  return guestCredits >= PUZZLE_PLAY_CREDIT_COST ? 'credit' : 'no_credits';
}

export async function canPlayJourneyLevel(journeyLevel, opts) {
  const access = await resolveJourneyPlayAccess(journeyLevel, opts);
  return access === 'free' || access === 'credit';
}

/**
 * Whether a daily puzzle can be started.
 * @returns {'free'|'credit'|'starter'|'no_credits'|null} null = blocked unknown
 */
export async function resolveDailyPlayAccess({ hasStarter, loggedIn, creditBalance = 0 }) {
  const freeLeft = await getFreeDailyPlaysRemaining();
  if (freeLeft > 0) return 'free';
  if (!hasStarter) return 'starter';
  if (loggedIn) {
    return creditBalance >= PUZZLE_PLAY_CREDIT_COST ? 'credit' : 'no_credits';
  }
  const guestCredits = await getGuestPuzzleCredits();
  return guestCredits >= PUZZLE_PLAY_CREDIT_COST ? 'credit' : 'no_credits';
}

export async function canPlayDailyPuzzle({ hasStarter, loggedIn, creditBalance = 0 }) {
  const access = await resolveDailyPlayAccess({ hasStarter, loggedIn, creditBalance });
  return access === 'free' || access === 'credit';
}

export async function canStartJourneyLevel(level, {
  hasStarter,
  loggedIn,
  creditBalance = 0,
  playerJourneyLevel = null,
}) {
  if (!journeyLevelNeedsCredit(level, playerJourneyLevel)) return true;
  if (!hasStarter) return false;
  if (loggedIn) return creditBalance >= PUZZLE_PLAY_CREDIT_COST;
  return (await getGuestPuzzleCredits()) >= PUZZLE_PLAY_CREDIT_COST;
}

/** Charge free daily slot or puzzle credit after a play session starts. */
export async function settlePuzzlePlayCharge({
  isDaily,
  journeyLevel,
  puzzleId,
  loggedIn,
  creditBalance = 0,
  playerJourneyLevel = null,
}) {
  const hasStarter = await hasStarterPackLocal();
  if (isDaily) {
    const access = await resolveDailyPlayAccess({ hasStarter, loggedIn, creditBalance });
    if (access === 'free') {
      await incrementFreeDailyPlaysUsed();
      return { ok: true };
    }
    if (access !== 'credit') return { ok: false, access };
    if (loggedIn) {
      const result = await CreditApi.consumeCredits({
        appCode: APP_STORE.appSiteId,
        featureUsed: `word_wheel_daily:${puzzleId}`,
        creditsConsumed: PUZZLE_PLAY_CREDIT_COST,
      });
      return { ok: true, creditBalance: result.creditBalance };
    }
    const spent = await consumeGuestPuzzleCredits();
    return spent.ok ? { ok: true } : { ok: false, access: 'no_credits' };
  }
  if (!journeyLevelNeedsCredit(journeyLevel, playerJourneyLevel)) return { ok: true };
  if (!hasStarter) return { ok: false, access: 'starter' };
  if (loggedIn) {
    const result = await CreditApi.consumeCredits({
      appCode: APP_STORE.appSiteId,
      featureUsed: `word_wheel_journey:${puzzleId}`,
      creditsConsumed: PUZZLE_PLAY_CREDIT_COST,
    });
    return { ok: true, creditBalance: result.creditBalance };
  }
  const spent = await consumeGuestPuzzleCredits();
  return spent.ok ? { ok: true } : { ok: false, access: 'no_credits' };
}
