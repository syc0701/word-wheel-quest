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
  const spin = useSharedValue(0);
  const starTwinkle = useSharedValue(1);
  const rayOpacity = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    spin.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
    starTwinkle.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 700, easing: Easing.out(Easing.quad) }),
        withTiming(0.85, { duration: 700, easing: Easing.in(Easing.quad) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    rayOpacity.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.25, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [pulse, scale, spin, starTwinkle, rayOpacity]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.8 + pulse.value * 0.55 }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const raysStyle = useAnimatedStyle(() => ({
    opacity: rayOpacity.value,
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starTwinkle.value }],
  }));

  return (
    <View style={styles.badgeWrap}>
      <Animated.View style={[styles.radialGlow, glowStyle]} />
      <Animated.View style={[styles.sparkleRing, raysStyle]}>
        {[0, 45, 90, 135].map((deg) => (
          <View
            key={deg}
            style={[
              styles.sparkRay,
              { transform: [{ rotate: `${deg}deg` }, { translateY: -46 }] },
            ]}
          />
        ))}
      </Animated.View>
      <Animated.View style={badgeStyle}>
        <LinearGradient
          colors={['#fff4c2', '#f6e27a', '#d4af37', '#a67c1a']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.metalBadge}
        >
          <View style={styles.badgeInner}>
            <Animated.View style={starStyle}>
              <Star size={36} color="#fffef0" fill="#ffe08a" strokeWidth={1.2} />
            </Animated.View>
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
        <Text
          style={[styles.statValue, highlight && styles.statValueGold]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
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
  message,
  timeCaption,
  starCaption,
}) {
  const isJourneyComplete = Boolean(message);
  const showTime = !isJourneyComplete && Boolean(timeCaption && timeLabel != null && timeLabel !== '');
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
      {isJourneyComplete ? (
        <Animated.Text
          entering={FadeInUp.duration(700).delay(280)}
          style={styles.message}
        >
          {message}
        </Animated.Text>
      ) : null}
      {showTime || showStar ? (
        <View style={styles.statsRow}>
          {showTime ? (
            <MarbleStat
              label={timeCaption}
              value={timeLabel}
              delay={320}
              fullWidth={!showStar}
            />
          ) : null}
          {showStar ? (
            <MarbleStat
              label={starCaption}
              value={starWord}
              highlight
              delay={isJourneyComplete ? 360 : 420}
              fullWidth={!showTime}
            />
          ) : null}
        </View>
      ) : null}
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
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(252, 211, 77, 0.5)',
  },
  sparkleRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkRay: {
    position: 'absolute',
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 236, 179, 0.95)',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  metalBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  message: {
    fontFamily: INTERMISSION.serif,
    fontSize: 16,
    fontWeight: '600',
    color: INTERMISSION.titleTeal,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    paddingHorizontal: 8,
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
