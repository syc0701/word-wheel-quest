/** Backend word_wheel_pack.code values. Playable via /v1/puzzle/wordwheel/journey?season= */
export const WORD_WHEEL_PACKS = [
  {
    code: 'classic',
    maxLevel: 200,
    packageId: 'bundle_classic',
    entitlement: 'classic',
    nameKey: 'pack.classic.name',
    detailKey: 'pack.classic.detail',
  },
  {
    code: 'hard_quest',
    maxLevel: 400,
    packageId: 'word_wheel_pack_hard_quest',
    entitlement: 'hard',
    nameKey: 'pack.hard.name',
    detailKey: 'pack.hard.detail',
  },
  {
    code: 'master',
    maxLevel: 500,
    packageId: 'bundle_master',
    entitlement: 'master',
    nameKey: 'pack.master.name',
    detailKey: 'pack.master.detail',
  },
];

export function packByCode(code) {
  return WORD_WHEEL_PACKS.find((pack) => pack.code === code) || null;
}
