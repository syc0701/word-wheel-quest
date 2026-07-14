import AsyncStorage from '@react-native-async-storage/async-storage';

export const APPEARANCE_KEY = 'ww.appearance';
export const APPEARANCE_LIGHT = 'light';
export const APPEARANCE_DARK = 'dark';
/** Weekly random scene photo from `assets/bg_image`. */
export const APPEARANCE_RANDOM = 'random';

const MODES = new Set([APPEARANCE_LIGHT, APPEARANCE_DARK, APPEARANCE_RANDOM]);

/**
 * Light play — deep water (ocean gradient behind play UI).
 */
export const WW_LIGHT = {
  gradient: ['#1a6b8a', '#0c4a6e', '#082f49', '#031525'],
  surface: 'rgba(15, 55, 75, 0.72)',
  border: 'rgba(125, 211, 252, 0.4)',
  borderStrong: 'rgba(186, 230, 253, 0.55)',
  text: '#f0f9ff',
  textSecondary: 'rgba(224, 242, 254, 0.78)',
  textMuted: 'rgba(186, 230, 253, 0.62)',
  textOnSurface: '#0c4a6e',
  accent: '#38bdf8',
  accentDark: '#0ea5e9',
  accentSoft: 'rgba(14, 165, 233, 0.22)',
  accentRing: 'rgba(56, 189, 248, 0.35)',
  wheelLine: '#fcd34d',
  wheelLineDark: '#f59e0b',
  wheelLineGlow: 'rgba(252, 211, 77, 0.5)',
  wheelLineSoft: 'rgba(254, 243, 199, 0.9)',
  success: '#34d399',
  successSoft: 'rgba(16, 185, 129, 0.28)',
  successText: '#ecfdf5',
  hintSoft: 'rgba(251, 191, 36, 0.32)',
  hintText: '#fde68a',
  gridHidden: 'rgba(56, 189, 248, 0.22)',
  gridInactive: 'rgba(14, 116, 144, 0.35)',
  gridBorder: 'rgba(125, 211, 252, 0.55)',
  gridRevealedBorder: '#7dd3fc',
  gridNumberBorder: '#38bdf8',
  gridNumberText: '#082f49',
  playGradient: ['#38bdf8', '#0284c7', '#0c4a6e', '#031525'],
  toolBtnBg: 'rgba(224, 242, 254, 0.2)',
  toolIcon: '#e0f2fe',
  clueBg: 'rgba(224, 242, 254, 0.18)',
  coinLabel: '#e0f2fe',
  letterBg: 'rgba(240, 249, 255, 0.96)',
  letterBgGradient: ['#f0f9ff', '#bae6fd'],
  letterText: '#0c4a6e',
  letterBorder: 'rgba(125, 211, 252, 0.9)',
  letterSelectedGradient: ['#fffbeb', '#fde68a', '#fbbf24'],
  letterSelectedBorder: '#fcd34d',
  letterSelectedText: '#78350f',
  radarGlassMid: 'rgba(56, 189, 248, 0.22)',
  radarGlassOuter: 'rgba(8, 47, 73, 0.35)',
  radarRim: 'rgba(186, 230, 253, 0.65)',
  radarStroke: 'rgba(255, 255, 255, 0.85)',
  radarStrokeSoft: 'rgba(186, 230, 253, 0.45)',
  radarHub: 'rgba(56, 189, 248, 0.5)',
  radarSweepMid: 'rgba(56, 189, 248, 0.16)',
  statusBar: 'light',
};

/** Dark — deeper ocean play. */
export const WW_DARK = {
  gradient: ['#0e7490', '#0c4a6e', '#082f49', '#020617'],
  surface: '#0c4a6e',
  border: 'rgba(125, 211, 252, 0.4)',
  borderStrong: 'rgba(186, 230, 253, 0.55)',
  text: '#f0f9ff',
  textSecondary: 'rgba(224, 242, 254, 0.75)',
  textMuted: 'rgba(186, 230, 253, 0.55)',
  textOnSurface: '#082f49',
  accent: '#38bdf8',
  accentDark: '#0ea5e9',
  accentSoft: 'rgba(14, 165, 233, 0.2)',
  accentRing: 'rgba(56, 189, 248, 0.35)',
  wheelLine: '#fcd34d',
  wheelLineDark: '#f59e0b',
  wheelLineGlow: 'rgba(252, 211, 77, 0.55)',
  wheelLineSoft: 'rgba(254, 243, 199, 0.9)',
  success: '#34d399',
  successSoft: 'rgba(16, 185, 129, 0.28)',
  successText: '#ecfdf5',
  hintSoft: 'rgba(251, 191, 36, 0.28)',
  hintText: '#fde68a',
  gridHidden: 'rgba(56, 189, 248, 0.18)',
  gridInactive: 'rgba(8, 47, 73, 0.55)',
  gridBorder: 'rgba(125, 211, 252, 0.5)',
  gridRevealedBorder: '#7dd3fc',
  gridNumberBorder: '#38bdf8',
  gridNumberText: '#082f49',
  playGradient: ['#22d3ee', '#0284c7', '#0c4a6e', '#020617'],
  toolBtnBg: 'rgba(224, 242, 254, 0.18)',
  toolIcon: '#e0f2fe',
  clueBg: 'rgba(224, 242, 254, 0.16)',
  coinLabel: '#e0f2fe',
  letterBg: 'rgba(240, 249, 255, 0.96)',
  letterBgGradient: ['#f0f9ff', '#bae6fd'],
  letterText: '#0c4a6e',
  letterBorder: 'rgba(125, 211, 252, 0.95)',
  letterSelectedGradient: ['#fffbeb', '#fde68a', '#fbbf24'],
  letterSelectedBorder: '#fcd34d',
  letterSelectedText: '#78350f',
  radarGlassMid: 'rgba(56, 189, 248, 0.24)',
  radarGlassOuter: 'rgba(2, 6, 23, 0.35)',
  radarRim: 'rgba(186, 230, 253, 0.7)',
  radarStroke: 'rgba(255, 255, 255, 0.88)',
  radarStrokeSoft: 'rgba(186, 230, 253, 0.5)',
  radarHub: 'rgba(56, 189, 248, 0.55)',
  radarSweepMid: 'rgba(56, 189, 248, 0.18)',
  statusBar: 'light',
};

/**
 * Random theme play chrome — light frosted UI over weekly photo scenes.
 */
export const WW_RANDOM = {
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
  wheelLine: '#f59e0b',
  wheelLineDark: '#d97706',
  wheelLineGlow: 'rgba(245, 158, 11, 0.45)',
  wheelLineSoft: 'rgba(254, 243, 199, 0.9)',
  success: '#059669',
  successSoft: 'rgba(167, 243, 208, 0.92)',
  successText: '#065f46',
  hintSoft: 'rgba(254, 243, 199, 0.95)',
  hintText: '#92400e',
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
  letterBg: 'rgba(255, 255, 255, 0.98)',
  letterBgGradient: ['#ffffff', '#f1f5f9'],
  letterText: '#0f172a',
  letterBorder: 'rgba(148, 163, 184, 0.85)',
  letterSelectedGradient: ['#fffbeb', '#fde68a', '#fbbf24'],
  letterSelectedBorder: '#f59e0b',
  letterSelectedText: '#78350f',
  radarGlassMid: 'rgba(226, 232, 240, 0.55)',
  radarGlassOuter: 'rgba(148, 163, 184, 0.22)',
  radarRim: 'rgba(203, 213, 225, 0.95)',
  radarStroke: 'rgba(100, 116, 139, 0.55)',
  radarStrokeSoft: 'rgba(148, 163, 184, 0.4)',
  radarHub: 'rgba(148, 163, 184, 0.55)',
  radarSweepMid: 'rgba(148, 163, 184, 0.16)',
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
  if (normalized === APPEARANCE_RANDOM) return WW_RANDOM;
  return WW_LIGHT;
}

export function getColors(mode) {
  const normalized = normalizeAppearance(mode);
  if (normalized === APPEARANCE_DARK) return COLORS_DARK;
  // Random: opaque frosted cards over photo scenes
  if (normalized === APPEARANCE_RANDOM) {
    return {
      ...COLORS_LIGHT,
      background: 'transparent',
      surface: 'rgba(255, 255, 255, 0.95)',
      surfaceLight: 'rgba(236, 242, 239, 0.98)',
      text: '#0b3d36',
      textMuted: 'rgba(15, 61, 54, 0.68)',
      primaryGlow: '#0f766e',
      statusBar: 'light',
      segmentTrackBg: 'rgba(226, 232, 240, 0.95)',
      segmentTrackBorder: 'rgba(148, 163, 184, 0.55)',
      segmentSelectedBg: '#ffffff',
      segmentSelectedText: '#0f3d36',
      segmentInactiveText: 'rgba(15, 61, 54, 0.55)',
    };
  }
  return COLORS_LIGHT;
}

export async function loadAppearance() {
  try {
    const raw = await AsyncStorage.getItem(APPEARANCE_KEY);
    if (raw == null || String(raw).trim() === '') {
      // Default: Image (weekly scene photos).
      await AsyncStorage.setItem(APPEARANCE_KEY, APPEARANCE_RANDOM);
      return APPEARANCE_RANDOM;
    }
    return normalizeAppearance(raw);
  } catch {
    return APPEARANCE_RANDOM;
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
