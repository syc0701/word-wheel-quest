import AsyncStorage from '@react-native-async-storage/async-storage';
import { IAP_PACKAGES } from '../constants/store';
import { WORD_WHEEL_PACKS, packByCode } from '../constants/packs';
import WordWheelApi from './api';

const STORAGE_KEY = 'ww.pack_entitlements';
const LEVEL_PREFIX = 'ww.pack_level.';

const EMPTY = {
  classic: false,
  hard: false,
  master: false,
  daily: false,
  removeAds: false,
};

function grantsForId(id) {
  if (!id) return null;
  const match = IAP_PACKAGES.find((pack) => pack.productId === id || pack.packageId === id);
  return match?.grants ?? null;
}

export async function loadPackEntitlements() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      classic: false,
      hard: false,
      master: false,
      daily: Boolean(parsed?.daily),
      removeAds: Boolean(parsed?.removeAds),
    };
  } catch {
    return { ...EMPTY };
  }
}

/** Paid pack seasons are owned when journey does not answer "Pack not owned". */
export async function serverOwnsPack(season) {
  try {
    const data = await WordWheelApi.fetchJourneyLevel(1, season);
    return data?.code !== 'FAILURE';
  } catch {
    return false;
  }
}

export async function loadOwnedPackCodes() {
  const owned = [];
  for (const pack of WORD_WHEEL_PACKS) {
    if (await serverOwnsPack(pack.code)) owned.push(pack.code);
  }
  return owned;
}

export async function grantPackEntitlement(productOrPackageId) {
  const grants = grantsForId(productOrPackageId);
  if (!grants) return loadPackEntitlements();
  const current = await loadPackEntitlements();
  const next = {
    daily: current.daily || Boolean(grants.daily),
    removeAds: current.removeAds || Boolean(grants.removeAds),
  };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export async function hasUnlimitedDaily() {
  const owned = await loadPackEntitlements();
  return owned.daily;
}

export async function hasRemoveAds() {
  const owned = await loadPackEntitlements();
  return owned.removeAds;
}

export async function hasClassicPack() {
  return serverOwnsPack('classic');
}

export function ownsPack(entitlements, pack) {
  if (!entitlements || !pack) return false;
  return Boolean(entitlements[pack.entitlement]);
}

export async function loadPackProgress(code) {
  const pack = packByCode(code);
  const max = pack?.maxLevel || 1;
  let stored = 1;
  try {
    const raw = await AsyncStorage.getItem(`${LEVEL_PREFIX}${code}`);
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 1) stored = Math.floor(n);
  } catch {
    /* ignore */
  }
  const cleared = Math.max(0, Math.min(max, stored - 1));
  return { cleared, max };
}

export async function loadPackLevel(code) {
  const pack = packByCode(code);
  try {
    const raw = await AsyncStorage.getItem(`${LEVEL_PREFIX}${code}`);
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 1) {
      return Math.min(Math.floor(n), pack?.maxLevel || n);
    }
  } catch {
    /* ignore */
  }
  return 1;
}

export async function savePackLevel(code, level) {
  const pack = packByCode(code);
  const max = pack?.maxLevel || level;
  const ceiling = pack?.maxLevel ? max + 1 : max;
  const next = Math.max(1, Math.min(ceiling, Math.floor(Number(level) || 1)));
  try {
    await AsyncStorage.setItem(`${LEVEL_PREFIX}${code}`, String(next));
  } catch {
    /* ignore */
  }
  return next;
}
