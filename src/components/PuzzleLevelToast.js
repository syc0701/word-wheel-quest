import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { BookOpen, Lightbulb } from 'lucide-react-native';
import { GiTwoCoins } from './GiTwoCoins';
import { WW } from '../constants/theme';
import { useT } from '../context/LanguageContext';

export default function PuzzleLevelToast({
  visible,
  isDaily,
  level,
  dailyLabel,
  title = '',
  wordCount = 0,
  maxScore = 0,
}) {
  const t = useT();

  if (!visible) return null;

  const headline = isDaily
    ? dailyLabel || t('toast.dailyFallback')
    : level != null
      ? t('toast.level', { n: level })
      : t('toast.levelFallback');

  const puzzleTitle = String(title || '').trim();
  const showTitle = Boolean(puzzleTitle);
  const showWords = Number(wordCount) > 0;
  const showScore = Number(maxScore) > 0;
  const showStats = showTitle || showWords || showScore;
  const guide = isDaily ? t('toast.guideDaily') : t('toast.guide');

  return (
    <Animated.View
      entering={FadeIn.duration(320)}
      exiting={FadeOut.duration(380)}
      style={styles.wrap}
      pointerEvents="none"
    >
      <View style={styles.backdrop} />

      <Animated.View entering={FadeIn.duration(360).delay(80)} style={styles.card}>
        <Text style={styles.headline}>{headline}</Text>

        {showStats ? (
          <View style={styles.stats}>
            {showTitle ? (
              <View style={styles.statRow}>
                <View style={styles.statIcon}>
                  <Lightbulb color="#ca8a04" size={24} strokeWidth={2.2} />
                </View>
                <Text style={styles.statText} numberOfLines={3}>
                  {puzzleTitle}
                </Text>
              </View>
            ) : null}
            {showWords ? (
              <View style={styles.statRow}>
                <View style={styles.statIcon}>
                  <BookOpen color={WW.accentDark} size={24} strokeWidth={2.2} />
                </View>
                <Text style={styles.statText}>{t('toast.words', { n: wordCount })}</Text>
              </View>
            ) : null}
            {showScore ? (
              <View style={styles.statRow}>
                <View style={styles.statIcon}>
                  <GiTwoCoins size={26} color="#eab308" />
                </View>
                <Text style={styles.statText}>{t('toast.maxScore', { n: maxScore })}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.guide}>{guide}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    paddingHorizontal: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.99)',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    minHeight: 320,
    borderWidth: 1.5,
    borderColor: WW.borderStrong,
    shadowColor: '#0f3d36',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 14,
  },
  headline: {
    fontSize: 48,
    fontWeight: '800',
    color: WW.textOnSurface,
    lineHeight: 54,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  stats: {
    marginTop: 22,
    alignSelf: 'stretch',
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(15, 118, 110, 0.09)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statIcon: {
    width: 34,
    alignItems: 'center',
  },
  statText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 19,
    fontWeight: '700',
    color: WW.textOnSurface,
    lineHeight: 26,
  },
  guide: {
    marginTop: 22,
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(15, 61, 54, 0.68)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 4,
  },
});
