import { WORD_WHEEL_DAILY_UNLOCK_LEVEL } from './api';
import { IAP_PACKAGES } from './store';

/** Journey levels 1…50 are free for everyone; level 51+ needs starter + credits. */
export const GUEST_MAX_LEVEL_WITHOUT_STARTER = WORD_WHEEL_DAILY_UNLOCK_LEVEL;

/**
 * Legacy players already at this journey level (or higher) before the paywall
 * may continue for free through level 59; paywall starts at level 60.
 */
export const GRANDFATHER_EXCEPTION_MIN_LEVEL = 56;
export const GRANDFATHER_MAX_LEVEL_WITHOUT_STARTER = 59;

/** First gated level for normal players (no grandfather). */
export const GUEST_STARTER_UNLOCK_LEVEL = GUEST_MAX_LEVEL_WITHOUT_STARTER + 1;

/** First gated level for grandfathered players (level 56+ on save). */
export const GRANDFATHER_STARTER_UNLOCK_LEVEL = GRANDFATHER_MAX_LEVEL_WITHOUT_STARTER + 1;

export const STARTER_PACK_PACKAGE_ID = 'bundle_starter';

export const STARTER_PACK_PRODUCT_ID =
  IAP_PACKAGES.find((p) => p.packageId === STARTER_PACK_PACKAGE_ID)?.productId
  ?? 'word_wheel_pack_starter';

/** Daily puzzles playable without starter pack or credits. */
export const FREE_DAILY_PLAYS = 10;

/** Credits granted with starter pack (guest local balance; signed-in via IAP verify). */
export const STARTER_PACK_PUZZLE_CREDITS = 50;

/** Credits spent to start one gated puzzle (journey 51+ or daily after free quota). */
export const PUZZLE_PLAY_CREDIT_COST = 1;
