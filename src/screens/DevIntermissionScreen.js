import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LevelIntermissionManager from '../components/LevelIntermissionManager';
import ScreenHeader from '../components/ScreenHeader';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import { SCREENS } from '../constants/theme';
import { LEVEL_SCREEN_TYPES } from '../lib/LevelScreenPolicy';

const PREVIEW_PROPS = {
  [LEVEL_SCREEN_TYPES.WORD_MASTER]: {
    levelNumber: 7,
    timeSpentSeconds: 95,
    sessionStreak: 1,
    starWord: 'QUEST',
  },
  [LEVEL_SCREEN_TYPES.STREAKS_SPARKS]: {
    levelNumber: 4,
    timeSpentSeconds: 28,
    sessionStreak: 6,
    starWord: 'SPARK',
  },
  [LEVEL_SCREEN_TYPES.BRAIN_POWER]: {
    levelNumber: 10,
    timeSpentSeconds: 120,
    sessionStreak: 2,
    starWord: 'CROWN',
  },
};

const TITLE_KEYS = {
  [LEVEL_SCREEN_TYPES.WORD_MASTER]: 'devIntermission.title.wordMaster',
  [LEVEL_SCREEN_TYPES.STREAKS_SPARKS]: 'devIntermission.title.streaksSparks',
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
    <LinearGradient
      colors={['#d8f5ef', '#b8e8de', '#7ecfc3']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <ScreenHeader
        title={t(titleKey)}
        onBack={() => navigate(SCREENS.SETTINGS, { backScreen: SCREENS.HOME })}
      />
      <View style={styles.body}>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {t('devIntermission.hint', { type: previewType })}
        </Text>
        <LevelIntermissionManager
          {...sample}
          forceScreenType={previewType}
          onNextLevel={() => navigate(SCREENS.SETTINGS, { backScreen: SCREENS.HOME })}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
});
