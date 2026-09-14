import { IAP_PACKAGES } from './store';

/**
 * Journey paywall removed — all Season Journey levels are free.
 * (Previously gated at level 51 behind Starter Fun Bundle + credits.)
 */
export const GUEST_MAX_LEVEL_WITHOUT_STARTER = 1_000_000;

/**
 * Legacy grandfather constants (unused while journey paywall is off).
 */
export const GRANDFATHER_EXCEPTION_MIN_LEVEL = 56;
export const GRANDFATHER_MAX_LEVEL_WITHOUT_STARTER = 59;

/** First gated level for normal players (unreachable while max free is 1e6). */
export const GUEST_STARTER_UNLOCK_LEVEL = GUEST_MAX_LEVEL_WITHOUT_STARTER + 1;

/** First gated level for grandfathered players (unused while journey paywall is off). */
export const GRANDFATHER_STARTER_UNLOCK_LEVEL = GRANDFATHER_MAX_LEVEL_WITHOUT_STARTER + 1;

export const STARTER_PACK_PACKAGE_ID = 'bundle_starter';

export const STARTER_PACK_PRODUCT_ID =
  IAP_PACKAGES.find((p) => p.packageId === STARTER_PACK_PACKAGE_ID)?.productId
  ?? 'word_wheel_pack_starter';

/** Daily puzzles playable without starter pack or credits. */
export const FREE_DAILY_PLAYS = 10;

/** Credits granted with starter pack (guest local balance; signed-in via IAP verify). */
export const STARTER_PACK_PUZZLE_CREDITS = 50;

/** Credits spent to start one gated daily puzzle (after free quota). */
export const PUZZLE_PLAY_CREDIT_COST = 1;
