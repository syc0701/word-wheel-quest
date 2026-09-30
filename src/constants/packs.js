/** Backend word_wheel_pack.code values. Playable via /v1/puzzle/wordwheel/journey?season= */
export const WORD_WHEEL_PACKS = [
  {
    code: 'classic',
    maxLevel: 200,
    packageId: 'bundle_classic',
    entitlement: 'classic',
    nameKey: 'pack.classic.name',
    detailKey: 'pack.classic.detail',
    promoTitleKey: 'pack.classic.promoTitle',
    promoBodyKey: 'pack.classic.promoBody',
  },
  {
    code: 'hard_quest',
    maxLevel: 400,
    packageId: 'word_wheel_pack_hard_quest',
    entitlement: 'hard',
    nameKey: 'pack.hard.name',
    detailKey: 'pack.hard.detail',
    promoTitleKey: 'pack.hard.promoTitle',
    promoBodyKey: 'pack.hard.promoBody',
  },
  {
    code: 'master',
    maxLevel: 500,
    packageId: 'bundle_master',
    entitlement: 'master',
    nameKey: 'pack.master.name',
    detailKey: 'pack.master.detail',
    promoTitleKey: 'pack.master.promoTitle',
    promoBodyKey: 'pack.master.promoBody',
  },
];

export function packByCode(code) {
  return WORD_WHEEL_PACKS.find((pack) => pack.code === code) || null;
}

/** Per-pack color. Icons are single-color art and take `icon` as a tint. */
export const PACK_THEMES = {
  classic: {
    icon: '#B45309',
    iconOnDark: '#FBBF24',
    gradient: ['#F59E0B', '#92400E'],
    glow: '#F59E0B',
  },
  hard_quest: {
    icon: '#BE123C',
    iconOnDark: '#FB7185',
    gradient: ['#F43F5E', '#9F1239'],
    glow: '#FB7185',
  },
  master: {
    icon: '#6D28D9',
    iconOnDark: '#C4B5FD',
    gradient: ['#8B5CF6', '#5B21B6'],
    glow: '#A78BFA',
  },
};

const PACK_ICON_CODE = {
  classicSwords: 'classic',
  hardQuestPeak: 'hard_quest',
  masterScroll: 'master',
};

export function packMarkColor(code, isDark) {
  const theme = PACK_THEMES[code] || PACK_THEMES[PACK_ICON_CODE[code]];
  if (!theme) return null;
  return isDark ? theme.iconOnDark : theme.icon;
}

export const PACK_ICON_TINT = {
  classicSwords: PACK_THEMES.classic.icon,
  hardQuestPeak: PACK_THEMES.hard_quest.icon,
  masterScroll: PACK_THEMES.master.icon,
};
