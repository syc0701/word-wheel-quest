import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift } from 'lucide-react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { INTERMISSION } from './intermissionTheme';

function PulseRing({ delay }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.12, 1], [0, 0.85, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.92, 1.28]) }],
  }));

  return <Animated.View pointerEvents="none" style={[styles.pulseRing, style]} />;
}

/**
 * Gold shop CTA for guest upsell on level complete.
 */
export default function ShopOfferButton({
  label,
  onPress,
  accessibilityLabel,
  icon: Icon = Gift,
  prominent = false,
}) {
  const shineX = useSharedValue(-120);
  const pressScale = useSharedValue(1);
  const glow = useSharedValue(0.65);
  const beat = useSharedValue(1);
  const iconPop = useSharedValue(0);

  useEffect(() => {
    shineX.value = withDelay(
      200,
      withRepeat(
        withTiming(280, { duration: prominent ? 1100 : 1800, easing: Easing.inOut(Easing.quad) }),
        -1,
        false
      )
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: prominent ? 700 : 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.45, { duration: prominent ? 700 : 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    if (!prominent) return undefined;
    beat.value = withRepeat(
      withSequence(
        withTiming(1.045, { duration: 280, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 420, easing: Easing.inOut(Easing.sin) }),
        withDelay(360, withTiming(1, { duration: 0 }))
      ),
      -1,
      false
    );
    iconPop.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 260, easing: Easing.out(Easing.back(2)) }),
        withTiming(0, { duration: 340, easing: Easing.inOut(Easing.quad) }),
        withDelay(700, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );
    return undefined;
  }, [shineX, glow, beat, iconPop, prominent]);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineX.value }, { skewX: '-18deg' }],
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.92 + glow.value * (prominent ? 0.2 : 0.12) }],
  }));

  const beatStyle = useAnimatedStyle(() => ({
    transform: [{ scale: beat.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(iconPop.value, [0, 1], [1, 1.28]) },
      { rotate: `${interpolate(iconPop.value, [0, 1], [0, -14])}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.wrap, prominent && styles.wrapProminent, pressStyle]}>
      {prominent ? (
        <>
          <PulseRing delay={0} />
          <PulseRing delay={700} />
        </>
      ) : null}
      <Animated.View pointerEvents="none" style={[styles.glowRing, prominent && styles.glowRingProminent, glowStyle]} />
      <Animated.View style={[styles.fullWidth, prominent ? beatStyle : undefined]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          pressScale.value = withTiming(0.97, { duration: 90 });
        }}
        onPressOut={() => {
          pressScale.value = withTiming(1, { duration: 140 });
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        style={styles.pressable}
      >
        <View style={styles.rim}>
          <LinearGradient
            colors={['#fde68a', '#f59e0b', '#d97706']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[styles.oval, prominent && styles.ovalProminent]}
          >
            <View style={styles.pearlHighlight} />
            <Animated.View pointerEvents="none" style={[styles.shine, shineStyle]} />
            <View style={styles.row}>
              <Animated.View style={prominent ? iconStyle : undefined}>
                <Icon color="#422006" size={prominent ? 26 : 22} strokeWidth={2.4} />
              </Animated.View>
              <Text style={[styles.label, prominent && styles.labelProminent]}>
                {prominent ? String(label).toUpperCase() : label}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 6,
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'stretch',
  },
  wrapProminent: {
    marginTop: 14,
    marginBottom: 4,
  },
  pulseRing: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 6,
    bottom: 2,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 214, 90, 0.95)',
  },
  glowRing: {
    position: 'absolute',
    top: 4,
    left: '8%',
    right: '8%',
    bottom: -4,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 191, 36, 0.42)',
  },
  glowRingProminent: {
    left: '4%',
    right: '4%',
    backgroundColor: 'rgba(251, 191, 36, 0.62)',
  },
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  pressable: {
    width: '100%',
    alignSelf: 'stretch',
  },
  rim: {
    borderRadius: 999,
    padding: 2.5,
    backgroundColor: INTERMISSION.buttonRim,
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  ovalProminent: {
    minHeight: 54,
  },
  oval: {
    minHeight: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  pearlHighlight: {
    position: 'absolute',
    top: 3,
    left: 18,
    right: 18,
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 42,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  label: {
    fontFamily: INTERMISSION.serifBold,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: '#422006',
    textShadowColor: 'rgba(255,255,255,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    flexShrink: 1,
  },
  labelProminent: {
    fontFamily: INTERMISSION.displayBold,
    fontSize: 16,
    letterSpacing: 1.2,
  },
});
