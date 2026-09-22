import { IAP_PACKAGES } from './store';

export const STARTER_PACK_PACKAGE_ID = 'bundle_starter';

export const STARTER_PACK_PRODUCT_ID =
  IAP_PACKAGES.find((p) => p.packageId === STARTER_PACK_PACKAGE_ID)?.productId
  ?? 'word_wheel_pack_starter';

/**
 * Letter credits granted by the shop packs. The server writes these.
 * One credit shows one hidden letter. Not used to unlock puzzles.
 */
export const PACK_LETTER_CREDITS = {
  starter: 150,
  classic: 50,
  master: 110,
};

export const STARTER_PACK_PUZZLE_CREDITS = PACK_LETTER_CREDITS.starter;
