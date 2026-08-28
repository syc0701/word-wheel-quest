import { Platform } from 'react-native';

/**
 * Premium interstitial palette — cozy cream card + gold accents + terracotta CTA.
 * Matches the warm Level Complete mockup (glossy star, chocolate titles, soft beige stats).
 */
export const INTERMISSION = {
  cardBg: ['#FFF8EF', '#F7EBD9', '#F0DFC8'],
  cardBorder: 'rgba(212, 148, 72, 0.55)',
  cardGlow: 'rgba(180, 110, 40, 0.28)',
  filigree: 'rgba(196, 140, 55, 0.2)',
  titleGold: '#5C3310',
  titleTeal: '#5C3310',
  titleChocolate: '#4A2C14',
  bodyMuted: 'rgba(110, 78, 48, 0.78)',
  bodyBeige: '#8B6B4A',
  marble: ['#FFFCF7', '#F5EBDC', '#EFE2CF'],
  marbleBorder: 'rgba(180, 140, 90, 0.35)',
  marbleHighlight: ['#fff8e7', '#f3e6c0', '#e8d5a0'],
  marbleHighlightBorder: 'rgba(184, 134, 11, 0.45)',
  /** Terracotta → chocolate CTA pill */
  button: ['#E07A3D', '#C45A28', '#6B3418'],
  buttonRim: 'rgba(212, 160, 80, 0.85)',
  buttonText: '#FFF8F0',
  wood: ['#6b3f24', '#8b5a33', '#5a3018'],
  woodInner: 'rgba(10, 50, 45, 0.55)',
  woodGold: 'rgba(212, 175, 55, 0.7)',
  flame: ['#ffb347', '#ff6b1a', '#c2410c'],
  flameGlow: 'rgba(251, 146, 60, 0.55)',
  crown: ['#c9a227', '#8b6914', '#e8c547'],
  bronze: ['#a67c52', '#7a5330', '#c4a574'],
  progressTrack: 'rgba(122, 83, 48, 0.35)',
  progressFill: ['#f6e27a', '#d4af37', '#b8860b'],
  display: Platform.select({
    ios: 'AvenirNext-DemiBold',
    android: 'sans-serif-medium',
    default: 'sans-serif',
  }),
  displayBold: Platform.select({
    ios: 'AvenirNext-Bold',
    android: 'sans-serif-black',
    default: 'sans-serif',
  }),
  serif: Platform.select({
    ios: 'AvenirNext-Medium',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  serifBold: Platform.select({
    ios: 'AvenirNext-DemiBold',
    android: 'sans-serif-medium',
    default: 'sans-serif',
  }),
};
