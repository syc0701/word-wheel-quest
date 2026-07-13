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
import { APPEARANCE_LIGHT } from '../lib/appearance';
import { useAppearance } from '../context/AppearanceContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function makeSmogBanks(count = 10) {
  return Array.from({ length: count }, (_, i) => {
    // Tiny soft orbs — stay out of the mid-screen grid band.
    const size = SCREEN_W * (0.055 + (i % 4) * 0.018);
    const goingRight = i % 2 === 0;
    // Prefer top strip or below-grid zone (clue / wheel).
    const inLowerBand = i % 3 !== 0;
    const top = inLowerBand
      ? SCREEN_H * (0.58 + ((i * 11) % 34) / 100) - size * 0.2
      : SCREEN_H * (0.01 + ((i * 7) % 8) / 100) - size * 0.15;
    return {
      id: i,
      size,
      top,
      duration: 16000 + (i % 5) * 3500,
      delay: (i % 6) * 900,
      goingRight,
      opacity: 0.32 + (i % 4) * 0.06,
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

  const startX = goingRight ? -size * 0.6 : SCREEN_W - size * 0.4;
  const endX = goingRight ? SCREEN_W - size * 0.4 : -size * 0.6;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.1, 0.5, 0.9, 1],
      [0, opacity, opacity, opacity * 0.9, 0]
    ),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [startX, endX]) },
      {
        translateY: interpolate(
          progress.value,
          [0, 0.5, 1],
          [0, goingRight ? -6 : 6, 0]
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
 * Drifting mist orbs behind home + play (light theme only).
 */
export default function HomeSmogEffect() {
  const { mode } = useAppearance();
  const banks = useMemo(() => makeSmogBanks(10), []);
  if (mode !== APPEARANCE_LIGHT) return null;

  // Soft white / seafoam mist on mint home and white play surfaces.
  const color = 'rgba(255, 255, 255, 0.48)';

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
    zIndex: 0,
    elevation: 0,
  },
  bank: {
    position: 'absolute',
    zIndex: 0,
    elevation: 0,
  },
});
