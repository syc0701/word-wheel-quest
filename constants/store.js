/** App Store Connect identifiers — Word Wheel Quest */
export const APP_STORE = {
  bundleId: 'com.puzint.wordwheel.app',
  sku: 'wordwheel_quest_2026',
  ascAppId: '6787691583',
  appStoreUrl: 'https://apps.apple.com/app/id6787691583',
  appSiteId: 'word_wheel_quest',
};

/** RevenueCat iOS public API key */
export const REVENUECAT_API_KEY = 'appl_dhJZZjrCKdpiAzYdjcJHddBLEmt';

/** In-app WebView URLs — append ?platform=app for minimal chrome on puzzleinteract.com */
export const APP_URLS = {
  marketing: 'https://www.puzzleinteract.com/marketing/word_wheel_quest?platform=app',
  privacy: 'https://www.puzzleinteract.com/legal/word_wheel_quest#privacy?platform=app',
  terms: 'https://www.puzzleinteract.com/legal/word_wheel_quest#terms?platform=app',
  support: 'https://www.puzzleinteract.com/support/word_wheel_quest?platform=app',
};

/** Settings → Help & legal links */
export const LEGAL_LINKS = [
  { id: 'marketing', label: 'Marketing', url: APP_URLS.marketing },
  { id: 'privacy', label: 'Privacy Policy', url: APP_URLS.privacy },
  { id: 'terms', label: 'Terms of Use', url: APP_URLS.terms },
  { id: 'support', label: 'Support', url: APP_URLS.support },
];

/** RevenueCat default offering — mirrors dashboard Packages tab */
export const REVENUECAT_OFFERING = {
  identifier: 'default',
  displayName: 'The standard set of packages',
};

/** Packages in default offering (RevenueCat package ID → App Store product ID) */
export const IAP_PACKAGES = [
  {
    packageId: 'coins_large',
    productId: 'word_wheel_coins_large',
    name: '1,000 Coins',
    description: 'Adds 1,000 coins to player balance',
    priceUsd: '$2.49',
  },
  {
    packageId: 'coins_small',
    productId: 'word_wheel_coins_small',
    name: '300 Coins',
    description: 'Adds 300 coins to player balance',
    priceUsd: '$0.99',
  },
  {
    packageId: 'bundle_master',
    productId: 'word_wheel_pack_hard',
    name: 'Master Quest',
    description: 'Unlocks the Master Quest levels',
    priceUsd: '$2.99',
  },
  {
    packageId: 'bundle_classic',
    productId: 'word_wheel_pack_medium',
    name: 'Classic Challenge',
    description: 'Unlocks the Classic Challenge levels',
    priceUsd: '$1.99',
  },
  {
    packageId: 'bundle_starter',
    productId: 'word_wheel_pack_starter',
    name: 'Starter Fun Bundle',
    description: 'Unlocks the Starter Fun Bundle levels',
    priceUsd: '$3.99',
  },
];

/** @deprecated Use IAP_PACKAGES */
export const IAP_PRODUCTS = IAP_PACKAGES.map(({ productId, name, priceUsd }) => ({
  productId,
  name,
  priceUsd,
}));
