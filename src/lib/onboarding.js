import AsyncStorage from '@react-native-async-storage/async-storage';

export const HAS_COMPLETED_ONBOARDING_KEY = 'hasCompletedOnboarding';

/** Tiny first-run puzzle: DOG down, LOG across, sharing O. Wheel letters D/O/G/L. */
export const ONBOARDING_PUZZLE = {
  id: 'onboarding-dog-log',
  title: 'Tutorial',
  language: 'english',
  gridSize: 8,
  wordsInUse: 'DOG\nLOG',
  details: { characters: ['D', 'O', 'G', 'L'] },
  displayClue: [
    { word: 'DOG', definition: 'A pet that barks' },
    { word: 'LOG', definition: 'A piece of wood' },
  ],
  filledCoordinates: [
    {
      word: 'DOG',
      direction: 'vertical',
      positions: [
        { row: 2, col: 3, value: 'D' },
        { row: 3, col: 3, value: 'O' },
        { row: 4, col: 3, value: 'G' },
      ],
    },
    {
      word: 'LOG',
      direction: 'horizontal',
      positions: [
        { row: 3, col: 2, value: 'L' },
        { row: 3, col: 3, value: 'O' },
        { row: 3, col: 4, value: 'G' },
      ],
    },
  ],
};

export async function hasCompletedOnboarding() {
  try {
    const value = await AsyncStorage.getItem(HAS_COMPLETED_ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingComplete() {
  try {
    await AsyncStorage.setItem(HAS_COMPLETED_ONBOARDING_KEY, 'true');
  } catch {
    // Local flag is best-effort; never block leaving the tutorial.
  }
}
