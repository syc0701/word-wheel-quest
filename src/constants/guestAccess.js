import { WORD_WHEEL_DAILY_UNLOCK_LEVEL } from './api';
import { IAP_PACKAGES } from './store';

/** Journey levels 1…50 are free; level 51+ needs starter pack + credits (all users). */
export const GUEST_MAX_LEVEL_WITHOUT_STARTER = WORD_WHEEL_DAILY_UNLOCK_LEVEL;

export const STARTER_PACK_PACKAGE_ID = 'bundle_starter';

export const STARTER_PACK_PRODUCT_ID =
  IAP_PACKAGES.find((p) => p.packageId === STARTER_PACK_PACKAGE_ID)?.productId
  ?? 'word_wheel_pack_starter';

/** First journey level gated behind the starter pack. */
export const GUEST_STARTER_UNLOCK_LEVEL = GUEST_MAX_LEVEL_WITHOUT_STARTER + 1;

/** Daily puzzles playable without starter pack or credits. */
export const FREE_DAILY_PLAYS = 10;

/** Credits granted with starter pack (guest local balance; signed-in via IAP verify). */
export const STARTER_PACK_PUZZLE_CREDITS = 50;

/** Credits spent to start one gated puzzle (journey 51+ or daily after free quota). */
export const PUZZLE_PLAY_CREDIT_COST = 1;
