import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { WW } from '../constants/theme';

export default function PuzzleLevelToast({ visible, isDaily, level, dailyLabel, title }) {
  if (!visible) return null;

  const headline = isDaily
    ? dailyLabel || 'Daily'
    : level != null
      ? `Level ${level}`
      : 'Level';

  return (
    <Animated.View
      entering={FadeIn.duration(280)}
      exiting={FadeOut.duration(320)}
      style={styles.wrap}
      pointerEvents="none"
    >
      <View style={styles.backdrop} />

      <Animated.View entering={FadeIn.duration(320).delay(60)} style={styles.card}>
        <Text style={styles.headline}>{headline}</Text>
        {title ? (
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        ) : null}
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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 24,
    paddingHorizontal: 52,
    paddingVertical: 40,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: WW.borderStrong,
    shadowColor: '#0f3d36',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
  headline: {
    fontSize: 48,
    fontWeight: '800',
    color: WW.textOnSurface,
    lineHeight: 54,
    textAlign: 'center',
  },
  title: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(15, 61, 54, 0.55)',
    maxWidth: 300,
    textAlign: 'center',
    lineHeight: 20,
  },
});
