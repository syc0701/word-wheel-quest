import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame } from 'lucide-react-native';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { INTERMISSION } from './intermissionTheme';

function FlickeringFlameBadge() {
  const flicker = useSharedValue(1);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    flicker.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 180, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.94, { duration: 140 }),
        withTiming(1.05, { duration: 160 }),
        withTiming(0.98, { duration: 120 }),
        withTiming(1.02, { duration: 200 })
      ),
      -1,
      false
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [flicker, glow]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flicker.value }, { rotate: `${(flicker.value - 1) * 8}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.9 + glow.value * 0.35 }],
  }));

  const castStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.55,
  }));

  return (
    <View style={styles.badgeWrap}>
      <Animated.View style={[styles.castGlow, castStyle]} />
      <Animated.View style={[styles.radialGlow, glowStyle]} />
      <Animated.View style={flameStyle}>
        <LinearGradient
          colors={INTERMISSION.flame}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={styles.metalBadge}
        >
          <Flame size={36} color="#fff7ed" fill="#fdba74" strokeWidth={1.4} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function StreakRevealBox({ label, multiplierText }) {
  const reveal = useSharedValue(0);
  const ember = useSharedValue(0.45);

  useEffect(() => {
    reveal.value = withDelay(
      280,
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) })
    );
    ember.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 1100, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
  }, [ember, reveal]);

  const wipeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(reveal.value, [0, 1], [0.04, 1]) }],
    opacity: interpolate(reveal.value, [0, 0.15, 1], [0, 1, 1]),
  }));

  const emberStyle = useAnimatedStyle(() => ({
    opacity: 0.82 + ember.value * 0.18,
    transform: [{ scale: 0.98 + ember.value * 0.04 }],
  }));

  return (
    <Animated.View style={[styles.streakOuter, wipeStyle]}>
      <LinearGradient colors={INTERMISSION.wood} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.woodFrame}>
        <View style={styles.woodInner}>
          <Text style={styles.streakLabel}>{label}</Text>
          <Animated.Text style={[styles.multiplier, emberStyle]}>{multiplierText}</Animated.Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export default function StreaksSparksCard({ title, titleColor, streakLabel, multiplierText }) {
  return (
    <View style={styles.body}>
      <FlickeringFlameBadge />
      <Animated.Text entering={FadeIn.duration(600).delay(120)} style={[styles.title, { color: titleColor }]}>
        {title}
      </Animated.Text>
      <StreakRevealBox label={streakLabel} multiplierText={multiplierText} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    width: '100%',
  },
  badgeWrap: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  castGlow: {
    position: 'absolute',
    width: 160,
    height: 120,
    borderRadius: 80,
    backgroundColor: INTERMISSION.flameGlow,
    top: 10,
  },
  radialGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 140, 50, 0.5)',
  },
  metalBadge: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 210, 150, 0.9)',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 14,
    elevation: 10,
  },
  title: {
    fontFamily: INTERMISSION.serifBold,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(234, 88, 12, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  streakOuter: {
    width: '100%',
    maxWidth: 260,
  },
  woodFrame: {
    borderRadius: 16,
    padding: 4,
    borderWidth: 1.5,
    borderColor: INTERMISSION.woodGold,
  },
  woodInner: {
    borderRadius: 12,
    backgroundColor: INTERMISSION.woodInner,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  streakLabel: {
    fontFamily: INTERMISSION.serif,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255, 228, 200, 0.78)',
    marginBottom: 6,
  },
  multiplier: {
    fontFamily: INTERMISSION.serifBold,
    fontSize: 44,
    fontWeight: '700',
    color: '#ffd7a8',
    lineHeight: 50,
    textShadowColor: 'rgba(251, 146, 60, 0.75)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
