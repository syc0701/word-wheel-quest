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
