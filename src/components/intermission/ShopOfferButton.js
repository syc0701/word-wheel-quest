import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { INTERMISSION } from './intermissionTheme';

/**
 * Gold shop CTA for guest upsell on level complete.
 */
export default function ShopOfferButton({ label, onPress, accessibilityLabel }) {
  const shineX = useSharedValue(-120);
  const pressScale = useSharedValue(1);
  const glow = useSharedValue(0.65);

  useEffect(() => {
    shineX.value = withDelay(
      200,
      withRepeat(
        withTiming(280, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        -1,
        false
      )
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.55, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [shineX, glow]);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineX.value }, { skewX: '-18deg' }],
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.92 + glow.value * 0.12 }],
  }));

  return (
    <Animated.View style={[styles.wrap, pressStyle]}>
      <Animated.View style={[styles.glowRing, glowStyle]} />
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
            style={styles.oval}
          >
            <View style={styles.pearlHighlight} />
            <Animated.View style={[styles.shine, shineStyle]} />
            <View style={styles.row}>
              <Gift color="#422006" size={22} strokeWidth={2.2} />
              <Text style={styles.label}>{label}</Text>
            </View>
          </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
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
  pressable: {
    width: '100%',
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
});
