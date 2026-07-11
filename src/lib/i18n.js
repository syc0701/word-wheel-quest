import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import ar from '../locales/ar';
import de from '../locales/de';
import en from '../locales/en';
import es from '../locales/es';
import fr from '../locales/fr';
import hi from '../locales/hi';
import ja from '../locales/ja';
import ko from '../locales/ko';
import pt from '../locales/pt';
import zh from '../locales/zh';

export const LANGUAGE_KEY = 'ww.language';

export const LOCALES = [
  { code: 'en', nativeName: 'English', englishName: 'English', rtl: false },
  { code: 'zh', nativeName: '中文', englishName: 'Chinese', rtl: false },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', rtl: false },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', rtl: false },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', rtl: true },
  { code: 'pt', nativeName: 'Português', englishName: 'Portuguese', rtl: false },
  { code: 'fr', nativeName: 'Français', englishName: 'French', rtl: false },
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese', rtl: false },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German', rtl: false },
  { code: 'ko', nativeName: '한국어', englishName: 'Korean', rtl: false },
];

const CATALOGS = { ar, de, en, es, fr, hi, ja, ko, pt, zh };
const SUPPORTED = new Set(LOCALES.map((l) => l.code));

let currentLocale = 'en';
let currentCatalog = en;

/*
function detectDeviceLocale() {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale || 'en';
    const primary = String(tag).split(/[-_]/)[0].toLowerCase();
    if (SUPPORTED.has(primary)) return primary;
  } catch {
    // ignore
  }
  return 'en';
}
*/

export function normalizeLocale(code) {
  const primary = String(code || '')
    .split(/[-_]/)[0]
    .toLowerCase();
  return SUPPORTED.has(primary) ? primary : 'en';
}

export function getLocaleMeta(code) {
  const normalized = normalizeLocale(code);
  return LOCALES.find((l) => l.code === normalized) || LOCALES.find((l) => l.code === 'en');
}

function applyCatalog(code) {
  currentLocale = normalizeLocale(code);
  currentCatalog = CATALOGS[currentLocale] || en;
}

export function getCurrentLocale() {
  return currentLocale;
}

export function isRtlLocale(code = currentLocale) {
  return Boolean(getLocaleMeta(code)?.rtl);
}

/** Simple `{name}` interpolation. Missing keys fall back to English, then the key. */
export function t(key, params) {
  const raw =
    currentCatalog?.[key] ?? en?.[key] ?? (typeof key === 'string' ? key : '');
  if (!params || typeof raw !== 'string') return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name) => {
    const value = params[name];
    return value == null ? `{${name}}` : String(value);
  });
}

export async function loadLanguage() {
  // English is the default while the Settings language picker is commented out.
  // When re-enabling LanguagePicker, restore something like:
  //   const raw = await AsyncStorage.getItem(LANGUAGE_KEY);
  //   applyCatalog(raw || detectDeviceLocale());
  applyCatalog('en');
  return currentLocale;
}

export async function saveLanguage(code) {
  const normalized = normalizeLocale(code);
  applyCatalog(normalized);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
  const rtl = isRtlLocale(normalized);
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }
  return normalized;
}

/** Sync bootstrap for non-React modules (auth errors, duration helpers). */
applyCatalog('en');
