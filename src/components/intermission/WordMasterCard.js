import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { INTERMISSION } from './intermissionTheme';

function PulsingStarBadge() {
  const pulse = useSharedValue(0.55);
  const scale = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.45, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [pulse, scale]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.85 + pulse.value * 0.45 }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.badgeWrap}>
      <Animated.View style={[styles.radialGlow, glowStyle]} />
      <Animated.View style={badgeStyle}>
        <LinearGradient
          colors={['#f6e27a', '#d4af37', '#a67c1a']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.metalBadge}
        >
          <View style={styles.badgeInner}>
            <Star size={34} color="#fff8dc" fill="#ffe08a" strokeWidth={1.4} />
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function MarbleStat({ label, value, highlight, delay, fullWidth }) {
  const scale = useSharedValue(0.82);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 11, stiffness: 160, mass: 0.85 })
    );
  }, [delay, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={ZoomIn.delay(delay).springify().damping(14)}
      style={[styles.statWrap, fullWidth && styles.statWrapFull, animStyle]}
    >
      <LinearGradient
        colors={highlight ? INTERMISSION.marbleHighlight : INTERMISSION.marble}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.marbleOval,
          {
            borderColor: highlight
              ? INTERMISSION.marbleHighlightBorder
              : INTERMISSION.marbleBorder,
          },
        ]}
      >
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, highlight && styles.statValueGold]} numberOfLines={1}>
          {value}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

export default function WordMasterCard({
  timeLabel,
  starWord,
  title,
  timeCaption,
  starCaption,
}) {
  const showStar = Boolean(starCaption && starWord != null && starWord !== '');

  return (
    <View style={styles.body}>
      <PulsingStarBadge />
      <Animated.Text
        entering={FadeInUp.duration(700).delay(180)}
        style={styles.title}
      >
        {title}
      </Animated.Text>
      <View style={styles.statsRow}>
        <MarbleStat
          label={timeCaption}
          value={timeLabel}
          delay={320}
          fullWidth={!showStar}
        />
        {showStar ? (
          <MarbleStat label={starCaption} value={starWord} highlight delay={420} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    width: '100%',
  },
  badgeWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  radialGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(252, 211, 77, 0.45)',
  },
  metalBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 236, 179, 0.85)',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 8,
  },
  badgeInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120, 80, 10, 0.22)',
  },
  title: {
    fontFamily: INTERMISSION.serif,
    fontSize: 28,
    fontWeight: '700',
    color: INTERMISSION.titleGold,
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  statWrap: {
    flex: 1,
  },
  statWrapFull: {
    flex: 1,
    maxWidth: '100%',
  },
  marbleOval: {
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1.2,
    minHeight: 72,
    justifyContent: 'center',
  },
  statLabel: {
    fontFamily: INTERMISSION.serif,
    fontSize: 11,
    color: INTERMISSION.bodyMuted,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  statValue: {
    fontFamily: INTERMISSION.serifBold,
    fontSize: 17,
    fontWeight: '700',
    color: INTERMISSION.titleTeal,
  },
  statValueGold: {
    color: '#8b6914',
  },
});
