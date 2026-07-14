import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LevelIntermissionManager from '../components/LevelIntermissionManager';
import ScreenHeader from '../components/ScreenHeader';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import { SCREENS } from '../constants/theme';
import { LEVEL_SCREEN_TYPES, MAX_JOURNEY_LEVEL } from '../lib/LevelScreenPolicy';

const PREVIEW_PROPS = {
  [LEVEL_SCREEN_TYPES.WORD_MASTER]: {
    levelNumber: MAX_JOURNEY_LEVEL,
    timeSpentSeconds: 95,
    starWord: 'QUEST',
  },
  [LEVEL_SCREEN_TYPES.STREAK_SPARKS]: {
    levelNumber: 100,
    timeSpentSeconds: 28,
    starWord: 'SPARK',
  },
  [LEVEL_SCREEN_TYPES.BRAIN_POWER]: {
    levelNumber: 10,
    timeSpentSeconds: 120,
    starWord: 'CROWN',
  },
};

const TITLE_KEYS = {
  [LEVEL_SCREEN_TYPES.WORD_MASTER]: 'devIntermission.title.wordMaster',
  [LEVEL_SCREEN_TYPES.STREAK_SPARKS]: 'devIntermission.title.streaksSparks',
  [LEVEL_SCREEN_TYPES.BRAIN_POWER]: 'devIntermission.title.brainPower',
};

export default function DevIntermissionScreen({ navigate, routeParams = {} }) {
  const { colors } = useAppearance();
  const t = useT();
  const previewType = routeParams.previewType || LEVEL_SCREEN_TYPES.WORD_MASTER;
  const sample = PREVIEW_PROPS[previewType] || PREVIEW_PROPS[LEVEL_SCREEN_TYPES.WORD_MASTER];

  useEffect(() => {
    if (!__DEV__) {
      navigate(SCREENS.SETTINGS, { backScreen: SCREENS.HOME });
    }
  }, [navigate]);

  if (!__DEV__) return null;

  const titleKey = TITLE_KEYS[previewType] || 'devIntermission.title.fallback';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t(titleKey)}
        onBack={() => navigate(SCREENS.SETTINGS, { backScreen: SCREENS.HOME })}
      />
      <View style={styles.body}>
        <Text style={[styles.hint, { color: colors.text }]}>
          {t('devIntermission.hint', { type: previewType })}
        </Text>
        <LevelIntermissionManager
          {...sample}
          forceScreenType={previewType}
          onNextLevel={() => navigate(SCREENS.SETTINGS, { backScreen: SCREENS.HOME })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
