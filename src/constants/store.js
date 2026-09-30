import { Platform } from 'react-native';

/** Shared backend app code (credit / user APIs). */
export const APP_SITE_ID = 'word_wheel_quest';

/** App Store Connect — Word Wheel Quest (iOS). */
export const APP_STORE = {
  bundleId: 'com.puzint.wordwheel.app',
  sku: 'wordwheel_quest_2026',
  ascAppId: '6787691583',
  appStoreUrl: 'https://apps.apple.com/app/id6787691583',
  appSiteId: APP_SITE_ID,
};

const REVENUECAT_IOS_KEY = 'appl_dhJZZjrCKdpiAzYdjcJHddBLEmt';

/** RevenueCat public SDK key for the current platform. */
export const REVENUECAT_API_KEY =
  Platform.OS === 'android'
    ? require('./playStore').REVENUECAT_ANDROID_KEY
    : REVENUECAT_IOS_KEY;

/** In-app WebView URLs — append ?platform=app for minimal chrome on puzzleinteract.com */
export const APP_URLS = {
  marketing: 'https://www.puzzleinteract.com/marketing/word_wheel_quest?platform=app',
  privacy: 'https://www.puzzleinteract.com/legal/word_wheel_quest#privacy?platform=app',
  terms: 'https://www.puzzleinteract.com/legal/word_wheel_quest#terms?platform=app',
  support: 'https://www.puzzleinteract.com/support/word_wheel_quest?platform=app',
};

/** Settings → Help & legal links (labels via i18n `legal.*`) */
export const LEGAL_LINKS = [
  { id: 'marketing', labelKey: 'legal.marketing', url: APP_URLS.marketing },
  { id: 'privacy', labelKey: 'legal.privacy', url: APP_URLS.privacy },
  { id: 'terms', labelKey: 'legal.terms', url: APP_URLS.terms },
  { id: 'support', labelKey: 'legal.support', url: APP_URLS.support },
];

/** RevenueCat default offering — mirrors dashboard Packages tab */
export const REVENUECAT_OFFERING = {
  identifier: 'default',
  displayName: 'The standard set of packages',
};

/** Packages in default offering (RevenueCat package ID → store product ID) */
export const IAP_PACKAGES = [
  {
    packageId: 'bundle_classic',
    productId: 'word_wheel_pack_medium',
    nameKey: 'shop.pack.classic.name',
    descriptionKey: 'shop.pack.classic.description',
    name: 'Classic Challenge',
    description: '200 journey puzzles.',
    priceUsd: '$1.99',
    icon: 'classicSwords',
    purchasable: true,
    grants: { classic: true },
  },
  {
    packageId: 'word_wheel_pack_hard_quest',
    productId: 'word_wheel_pack_hard_quest',
    nameKey: 'shop.pack.hard.name',
    descriptionKey: 'shop.pack.hard.description',
    name: 'Hard Quest',
    description: '400 hard puzzles. Words are 4–8 letters.',
    priceUsd: '$2.99',
    icon: 'hardQuestPeak',
    purchasable: true,
    grants: { hard: true },
  },
  {
    packageId: 'bundle_master',
    productId: 'word_wheel_pack_hard',
    nameKey: 'shop.pack.master.name',
    descriptionKey: 'shop.pack.master.description',
    name: 'Master Quest',
    description: '500 master journey puzzles. Most words are 3–8 letters.',
    priceUsd: '$2.99',
    icon: 'masterScroll',
    purchasable: true,
    grants: { master: true },
  },
  {
    packageId: 'word_wheel_daily',
    productId: 'word_wheel_quest_daily',
    nameKey: 'shop.pack.daily.name',
    descriptionKey: 'shop.pack.daily.description',
    name: 'Daily Bundle',
    description: 'Opens unlimited daily puzzles.',
    priceUsd: '$1.99',
    icon: 'starterChest',
    purchasable: true,
    grants: { daily: true },
  },
  {
    packageId: 'bundle_starter',
    productId: 'word_wheel_pack_starter',
    nameKey: 'shop.pack.starter.name',
    descriptionKey: 'shop.pack.starter.description',
    name: 'Starter Fun Bundle',
    description: 'Classic Challenge (200 puzzles) and unlimited daily puzzles.',
    priceUsd: '$3.99',
    icon: 'starterChest',
    purchasable: true,
    shopHidden: true,
    grants: { classic: true, daily: true },
  },
  {
    packageId: 'word_wheel_remove_ads',
    productId: 'word_wheel_quest_remove_ads',
    nameKey: 'shop.pack.removeAds.name',
    descriptionKey: 'shop.pack.removeAds.description',
    name: 'Remove Ads',
    description: 'No banner ads and no ad every 5 levels.',
    priceUsd: '$2.99',
    icon: 'goldCoins',
    purchasable: true,
    grants: { removeAds: true },
  },
  {
    packageId: 'coins_small',
    productId: 'word_wheel_coins_small',
    nameKey: 'shop.pack.coinsSmall.name',
    descriptionKey: 'shop.pack.coinsSmall.description',
    name: '300 Coins',
    description: 'Adds 300 coins to player balance',
    priceUsd: '$0.99',
    icon: 'goldCoins',
    purchasable: true,
    coinsGrant: 300,
  },
  {
    packageId: 'coins_large',
    productId: 'word_wheel_coins_large',
    nameKey: 'shop.pack.coinsLarge.name',
    descriptionKey: 'shop.pack.coinsLarge.description',
    name: '1,000 Coins',
    description: 'Adds 1,000 coins to player balance',
    priceUsd: '$2.49',
    icon: 'goldCoins',
    purchasable: true,
    coinsGrant: 1000,
  },
];

/** @deprecated Use IAP_PACKAGES */
export const IAP_PRODUCTS = IAP_PACKAGES.map(({ productId, name, priceUsd }) => ({
  productId,
  name,
  priceUsd,
}));
