import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { APPEARANCE_LIGHT, APPEARANCE_RANDOM } from '../lib/appearance';
import { useAppearance } from '../context/AppearanceContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function makeSmogBanks(count = 12) {
  return Array.from({ length: count }, (_, i) => {
    const size = SCREEN_W * (0.08 + (i % 5) * 0.035);
    const goingRight = i % 2 === 0;
    // Spread across the full screen so mist shows through transparent grid gaps.
    const band = i % 3;
    const top =
      band === 0
        ? SCREEN_H * (0.02 + ((i * 7) % 18) / 100) - size * 0.1
        : band === 1
          ? SCREEN_H * (0.28 + ((i * 9) % 28) / 100) - size * 0.15
          : SCREEN_H * (0.58 + ((i * 11) % 32) / 100) - size * 0.2;
    return {
      id: i,
      size,
      top,
      duration: 18000 + (i % 5) * 4000,
      delay: (i % 6) * 800,
      goingRight,
      opacity: 0.22 + (i % 5) * 0.05,
    };
  });
}

function SmogBank({ size, top, duration, delay, goingRight, opacity, color }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [progress, duration, delay]);

  const startX = goingRight ? -size * 0.7 : SCREEN_W - size * 0.3;
  const endX = goingRight ? SCREEN_W - size * 0.3 : -size * 0.7;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.12, 0.5, 0.88, 1],
      [0, opacity, opacity, opacity * 0.85, 0]
    ),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [startX, endX]) },
      {
        translateY: interpolate(
          progress.value,
          [0, 0.5, 1],
          [0, goingRight ? -10 : 10, 0]
        ),
      },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bank,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          top,
          left: 0,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Soft drifting mist — rendered between background and UI chrome.
 */
export default function HomeSmogEffect() {
  const { mode } = useAppearance();
  const banks = useMemo(() => makeSmogBanks(12), []);
  if (mode !== APPEARANCE_LIGHT && mode !== APPEARANCE_RANDOM) return null;

  const color =
    mode === APPEARANCE_RANDOM
      ? 'rgba(226, 242, 255, 0.38)'
      : 'rgba(255, 255, 255, 0.52)';

  return (
    <View style={styles.layer} pointerEvents="none">
      {banks.map((bank) => (
        <SmogBank key={bank.id} {...bank} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bank: {
    position: 'absolute',
  },
});
