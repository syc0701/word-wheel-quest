import AsyncStorage from '@react-native-async-storage/async-storage';

export const APPEARANCE_KEY = 'ww.appearance';
export const APPEARANCE_LIGHT = 'light';
export const APPEARANCE_DARK = 'dark';
/** Weekly random scene photo from `assets/bg_image`. */
export const APPEARANCE_RANDOM = 'random';

const MODES = new Set([APPEARANCE_LIGHT, APPEARANCE_DARK, APPEARANCE_RANDOM]);

/**
 * Light play — clean white / soft slate (not mint green).
 */
export const WW_LIGHT = {
  gradient: ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0'],
  surface: 'rgba(255, 255, 255, 0.94)',
  border: 'rgba(148, 163, 184, 0.4)',
  borderStrong: 'rgba(148, 163, 184, 0.65)',
  text: '#0f172a',
  textSecondary: 'rgba(15, 23, 42, 0.68)',
  textMuted: 'rgba(15, 23, 42, 0.45)',
  textOnSurface: '#334155',
  accent: '#0d9488',
  accentDark: '#0f766e',
  accentSoft: 'rgba(241, 245, 249, 0.9)',
  accentRing: 'rgba(13, 148, 136, 0.28)',
  /** Amber lock — warm contrast on cool white */
  wheelLine: '#f59e0b',
  wheelLineDark: '#d97706',
  wheelLineGlow: 'rgba(245, 158, 11, 0.45)',
  wheelLineSoft: 'rgba(254, 243, 199, 0.9)',
  success: '#059669',
  successSoft: 'rgba(167, 243, 208, 0.92)',
  successText: '#065f46',
  hintSoft: 'rgba(254, 243, 199, 0.95)',
  hintText: '#92400e',
  /** Grid keeps the previous mint / seafoam look on the white play page */
  gridHidden: 'rgba(204, 251, 241, 0.92)',
  gridInactive: 'rgba(167, 243, 208, 0.45)',
  gridBorder: 'rgba(110, 231, 183, 0.9)',
  gridRevealedBorder: '#bbf7d0',
  gridNumberBorder: '#059669',
  gridNumberText: '#064e3b',
  playGradient: ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0'],
  toolBtnBg: 'rgba(255, 255, 255, 0.95)',
  toolIcon: '#475569',
  clueBg: 'rgba(255, 255, 255, 0.94)',
  coinLabel: '#64748b',
  /** Letter pods on the radar */
  letterBg: 'rgba(255, 255, 255, 0.98)',
  letterBgGradient: ['#ffffff', '#f1f5f9'],
  letterText: '#0f172a',
  letterBorder: 'rgba(148, 163, 184, 0.85)',
  letterSelectedGradient: ['#fffbeb', '#fde68a', '#fbbf24'],
  letterSelectedBorder: '#f59e0b',
  letterSelectedText: '#78350f',
  /** Radar glass (light) */
  radarGlassMid: 'rgba(226, 232, 240, 0.55)',
  radarGlassOuter: 'rgba(148, 163, 184, 0.22)',
  radarRim: 'rgba(203, 213, 225, 0.95)',
  radarStroke: 'rgba(100, 116, 139, 0.55)',
  radarStrokeSoft: 'rgba(148, 163, 184, 0.4)',
  radarHub: 'rgba(148, 163, 184, 0.55)',
  radarSweepMid: 'rgba(148, 163, 184, 0.16)',
  statusBar: 'dark',
};

/** Dark — deep teal play. */
export const WW_DARK = {
  gradient: ['#124036', '#0A2925', '#051412'],
  surface: '#153D38',
  border: 'rgba(153, 246, 228, 0.45)',
  borderStrong: 'rgba(204, 251, 241, 0.65)',
  text: '#f0faf6',
  textSecondary: 'rgba(224, 242, 236, 0.72)',
  textMuted: 'rgba(224, 242, 236, 0.5)',
  textOnSurface: '#064e3b',
  accent: '#5eead4',
  accentDark: '#2dd4bf',
  accentSoft: 'rgba(45, 212, 191, 0.18)',
  accentRing: 'rgba(45, 212, 191, 0.35)',
  wheelLine: '#fcd34d',
  wheelLineDark: '#f59e0b',
  wheelLineGlow: 'rgba(252, 211, 77, 0.55)',
  wheelLineSoft: 'rgba(254, 243, 199, 0.9)',
  success: '#34d399',
  successSoft: 'rgba(16, 185, 129, 0.28)',
  successText: '#ecfdf5',
  hintSoft: 'rgba(251, 191, 36, 0.28)',
  hintText: '#fde68a',
  gridHidden: 'rgba(167, 243, 208, 0.16)',
  gridInactive: 'rgba(167, 243, 208, 0.08)',
  gridBorder: 'rgba(153, 246, 228, 0.65)',
  gridRevealedBorder: '#bbf7d0',
  gridNumberBorder: '#5eead4',
  gridNumberText: '#064e3b',
  playGradient: ['#0f766e', '#0d9488', '#115e59', '#042f2e'],
  toolBtnBg: 'rgba(236, 253, 245, 0.28)',
  toolIcon: '#ecfdf5',
  clueBg: 'rgba(236, 253, 245, 0.22)',
  coinLabel: '#f0faf6',
  /** Bright pods + dark letters so they read on the glowing radar */
  letterBg: 'rgba(236, 253, 245, 0.96)',
  letterBgGradient: ['#ecfdf5', '#99f6e4'],
  letterText: '#064e3b',
  letterBorder: 'rgba(153, 246, 228, 0.95)',
  letterSelectedGradient: ['#fffbeb', '#fde68a', '#fbbf24'],
  letterSelectedBorder: '#fcd34d',
  letterSelectedText: '#78350f',
  /** Radar glass (dark teal) */
  radarGlassMid: 'rgba(153, 246, 228, 0.26)',
  radarGlassOuter: 'rgba(13, 148, 136, 0.16)',
  radarRim: 'rgba(204, 251, 241, 0.7)',
  radarStroke: 'rgba(255, 255, 255, 0.88)',
  radarStrokeSoft: 'rgba(236, 253, 245, 0.5)',
  radarHub: 'rgba(45, 212, 191, 0.55)',
  radarSweepMid: 'rgba(153, 246, 228, 0.18)',
  statusBar: 'light',
};

/** Settings / home chrome — soft mint (not flat iOS white). */
export const COLORS_LIGHT = {
  background: '#e8f5f0',
  surface: '#f3fbf7',
  surfaceLight: '#d8f3e7',
  primary: '#0d9488',
  primaryGlow: '#0f766e',
  accent: '#0d9488',
  accentDark: '#0f766e',
  accentGlow: '#14b8a6',
  success: '#059669',
  warning: '#b45309',
  text: '#064e3b',
  textMuted: 'rgba(6, 78, 59, 0.55)',
  lineGlow: 'rgba(13, 148, 136, 0.4)',
  particle: '#f59e0b',
  segmentTrackBg: 'rgba(13, 148, 136, 0.12)',
  segmentTrackBorder: 'rgba(13, 148, 136, 0.18)',
  segmentSelectedBg: '#ecfdf5',
  segmentSelectedText: '#064e3b',
  segmentInactiveText: 'rgba(6, 78, 59, 0.55)',
  statusBar: 'dark',
};

/** Settings / shop chrome — deep green (matches play dark). */
export const COLORS_DARK = {
  background: '#0A2925',
  surface: '#153D38',
  surfaceLight: '#1a4a43',
  primary: '#2dd4bf',
  primaryGlow: '#5eead4',
  accent: '#2dd4bf',
  accentDark: '#14b8a6',
  accentGlow: '#5eead4',
  success: '#34d399',
  warning: '#fbbf24',
  text: '#f0faf6',
  textMuted: 'rgba(224, 242, 236, 0.68)',
  lineGlow: 'rgba(45, 212, 191, 0.45)',
  particle: '#fbbf24',
  segmentTrackBg: 'rgba(0, 0, 0, 0.28)',
  segmentTrackBorder: 'rgba(59, 166, 102, 0.28)',
  segmentSelectedBg: '#1a4a43',
  segmentSelectedText: '#f0faf6',
  segmentInactiveText: 'rgba(224, 242, 236, 0.58)',
  statusBar: 'light',
};

export function normalizeAppearance(value) {
  const mode = String(value ?? '').trim().toLowerCase();
  return MODES.has(mode) ? mode : APPEARANCE_LIGHT;
}

export function getWW(mode) {
  const normalized = normalizeAppearance(mode);
  if (normalized === APPEARANCE_DARK) return WW_DARK;
  // Random scenes use light chrome; status bar light (white icons) over photo + scrim
  if (normalized === APPEARANCE_RANDOM) {
    return { ...WW_LIGHT, statusBar: 'light' };
  }
  return WW_LIGHT;
}

export function getColors(mode) {
  const normalized = normalizeAppearance(mode);
  if (normalized === APPEARANCE_DARK) return COLORS_DARK;
  // Random uses light surfaces with slightly glassier cards over photos
  if (normalized === APPEARANCE_RANDOM) {
    return {
      ...COLORS_LIGHT,
      background: 'transparent',
      surface: 'rgba(255, 255, 255, 0.88)',
      surfaceLight: 'rgba(241, 245, 249, 0.82)',
      statusBar: 'light',
    };
  }
  return COLORS_LIGHT;
}

export async function loadAppearance() {
  try {
    const raw = await AsyncStorage.getItem(APPEARANCE_KEY);
    return normalizeAppearance(raw);
  } catch {
    return APPEARANCE_LIGHT;
  }
}

export async function saveAppearance(mode) {
  const normalized = normalizeAppearance(mode);
  try {
    await AsyncStorage.setItem(APPEARANCE_KEY, normalized);
  } catch {
    /* ignore */
  }
  return normalized;
}
