/** Warm Cream puzzle grid palette — high-contrast letters on cream. */
export const GRID_CREAM = {
  cellBg: '#FFF8EE',
  cellBorder: '#E8A855',
  cellBorderWidth: 1.5,
  cellText: '#2D2D2D',

  selectedBg: '#FFE8CC',
  selectedBorder: '#E07A1A',
  selectedBorderWidth: 2,
  selectedText: '#1A1A1A',

  badgeBg: '#FFFFFF',
  badgeBorder: '#D4A373',
  badgeText: '#333333',

  /** Hint-revealed cells stay warm but distinct from selection. */
  hintBg: '#FFF0D6',
  hintBorder: '#E8A855',
  hintText: '#2D2D2D',

  /** Correctly revealed (non-hint) letters keep cream fill + dark ink. */
  revealedBg: '#FFF8EE',
  revealedBorder: '#E8A855',
  revealedText: '#2D2D2D',

  celebrateBg: '#FFE8CC',
  celebrateBorder: '#E07A1A',
  alreadyBg: '#FFF0D6',
  alreadyBorder: '#E8A855',
};

export const GRID_TRANSITION_MS = 180;

const BADGE_ODD = {
  colors: ['#FFF4E4', '#FFD7A8'],
  border: '#E07A1A',
  text: '#3A2A1A',
};

const BADGE_EVEN = {
  colors: ['#FFFFFF', '#FFF0D6'],
  border: GRID_CREAM.badgeBorder,
  text: GRID_CREAM.badgeText,
};

const BADGE_ODD_DARK = {
  colors: ['#4A3018', '#6B4524'],
  border: '#E8A855',
  text: '#FFF8EE',
};

const BADGE_EVEN_DARK = {
  colors: ['#2A2420', '#3D342C'],
  border: '#D4A373',
  text: '#FFF8EE',
};

/** Odd and even word numbers use different badge colors. */
export function wordNumberBadgeTone(label, isDark) {
  const match = String(label ?? '').match(/\d+/);
  const odd = match ? Number(match[0]) % 2 === 1 : false;
  if (isDark) return odd ? BADGE_ODD_DARK : BADGE_EVEN_DARK;
  return odd ? BADGE_ODD : BADGE_EVEN;
}
