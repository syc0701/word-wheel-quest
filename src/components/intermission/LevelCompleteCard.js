import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { INTERMISSION } from './intermissionTheme';

function GlossyGoldStar() {
  const pulse = useSharedValue(0.55);
  const scale = useSharedValue(1);
  const spin = useSharedValue(0);
  const starTwinkle = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.45, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    spin.value = withRepeat(
      withTiming(360, { duration: 9000, easing: Easing.linear }),
      -1,
      false
    );
    starTwinkle.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 700, easing: Easing.out(Easing.quad) }),
        withTiming(0.9, { duration: 700, easing: Easing.in(Easing.quad) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [pulse, scale, spin, starTwinkle]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.85 + pulse.value * 0.45 }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const raysStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.35,
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
              { transform: [{ rotate: `${deg}deg` }, { translateY: -44 }] },
            ]}
          />
        ))}
      </Animated.View>
      <Animated.View style={badgeStyle}>
        <LinearGradient
          colors={['#FFF6C8', '#F5D76E', '#D4A017', '#A67C00']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.metalBadge}
        >
          <View style={styles.badgeInner}>
            <Animated.View style={starStyle}>
              <Star size={34} color="#FFFDF2" fill="#FFE08A" strokeWidth={1.2} />
            </Animated.View>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

/**
 * Standard Level Complete body — warm cream card content (star + compliment + stats).
 */
export default function LevelCompleteCard({
  title,
  levelLabel,
  hintsLabel,
  rewardsLabel,
}) {
  return (
    <View style={styles.body}>
      <GlossyGoldStar />
      <Animated.Text entering={FadeInUp.duration(650).delay(140)} style={styles.title}>
        {title}
      </Animated.Text>
      <Animated.View entering={FadeInUp.duration(650).delay(240)} style={styles.stats}>
        {levelLabel ? <Text style={styles.statLine}>{levelLabel}</Text> : null}
        {hintsLabel ? <Text style={styles.statLine}>{hintsLabel}</Text> : null}
        {rewardsLabel ? <Text style={[styles.statLine, styles.rewardsLine]}>{rewardsLabel}</Text> : null}
      </Animated.View>
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
    marginBottom: 12,
  },
  radialGlow: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(245, 186, 70, 0.45)',
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
    height: 13,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 230, 160, 0.95)',
  },
  metalBadge: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 240, 190, 0.9)',
    shadowColor: '#C9951A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  badgeInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(110, 70, 8, 0.22)',
  },
  title: {
    fontFamily: INTERMISSION.displayBold,
    fontSize: 30,
    fontWeight: '800',
    color: INTERMISSION.titleChocolate,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  stats: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  statLine: {
    fontFamily: INTERMISSION.serif,
    fontSize: 16,
    fontWeight: '600',
    color: INTERMISSION.bodyBeige,
    textAlign: 'center',
    lineHeight: 22,
  },
  rewardsLine: {
    fontWeight: '700',
    color: '#7A5230',
  },
});
