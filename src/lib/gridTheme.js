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

/** Light and Image: warm chips on the cream board. */
const BADGE_LIGHT = {
  odd: {
    colors: ['#6B3E12', '#C47A32'],
    text: '#FFF6E4',
    border: '#4A280C',
  },
  even: {
    colors: ['#FFF8EE', '#F0C56A'],
    text: '#3D2412',
    border: '#C9892E',
  },
};

/** Dark: cool chips so odd and even still swap, on the ocean board. */
const BADGE_DARK = {
  odd: {
    colors: ['#083344', '#0E7490'],
    text: '#ECFEFF',
    border: '#155E75',
  },
  even: {
    colors: ['#ECFEFF', '#67E8F9'],
    text: '#083344',
    border: '#A5F3FC',
  },
};

/** Odd word numbers share one pair; even numbers use the swapped pair. */
export function wordNumberBadgeTone(label, isDark = false) {
  const match = String(label ?? '').match(/\d+/);
  const n = match ? Number(match[0]) : 1;
  const palette = isDark ? BADGE_DARK : BADGE_LIGHT;
  return n % 2 === 1 ? palette.odd : palette.even;
}
