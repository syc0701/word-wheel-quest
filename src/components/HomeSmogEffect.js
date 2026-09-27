import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { APPEARANCE_DARK, APPEARANCE_RANDOM } from '../lib/appearance';
import { useAmbientActive } from '../lib/adAmbientPause';
import { useAppearance } from '../context/AppearanceContext';

const MAX_BANK = 36;

/** Stable 0..1 value so each puff keeps its own path across reloads. */
function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function makeSmogBanks(width, height, count = 18) {
  return Array.from({ length: count }, (_, i) => {
    const r = (k) => hash(i * 19 + k * 7);
    const size = 14 + r(1) * (MAX_BANK - 14);
    return {
      id: i,
      size,
      homeX: r(2) * Math.max(0, width - size),
      homeY: r(3) * Math.max(0, height - size),
      duration: 16000 + Math.floor(r(4) * 26000),
      delay: Math.floor(r(5) * 9000),
      ampX: 12 + r(6) * 72,
      ampY: 10 + r(7) * 56,
      ampX2: 6 + r(8) * 22,
      ampY2: 5 + r(9) * 18,
      freqX: 1 + Math.floor(r(10) * 2),
      freqY: 1 + Math.floor(r(11) * 3),
      phaseX: r(12) * Math.PI * 2,
      phaseY: r(13) * Math.PI * 2,
      phaseS: r(14) * Math.PI * 2,
      opacity: 0.18 + r(15) * 0.36,
    };
  });
}

function SmogBank({
  size,
  homeX,
  homeY,
  duration,
  delay,
  ampX,
  ampY,
  ampX2,
  ampY2,
  freqX,
  freqY,
  phaseX,
  phaseY,
  phaseS,
  opacity,
  color,
  active,
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(progress);
    if (!active) {
      progress.value = 0;
      return undefined;
    }
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.Never,
        }),
        -1,
        false
      )
    );
    return () => cancelAnimation(progress);
  }, [progress, duration, delay, active]);

  const animatedStyle = useAnimatedStyle(() => {
    const turn = progress.value * Math.PI * 2;
    const driftX =
      Math.sin(turn * freqX + phaseX) * ampX +
      Math.sin(turn * (freqX + 1) + phaseY) * ampX2;
    const driftY =
      Math.sin(turn * freqY + phaseY) * ampY +
      Math.cos(turn * freqX + phaseX) * ampY2;
    const breathe = 0.86 + 0.22 * (0.5 + 0.5 * Math.sin(turn + phaseS));
    const fade = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(turn * freqY + phaseS));
    return {
      opacity: opacity * fade,
      transform: [{ translateX: driftX }, { translateY: driftY }, { scale: breathe }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bank,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          top: homeY,
          left: homeX,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Soft drifting mist — rendered between background and UI chrome.
 * Visibility is controlled by the parent (GradientBackground).
 * Each puff hangs in its own spot and wanders on a private loop, so the
 * layer does not split into two marching lines.
 */
export default function HomeSmogEffect() {
  const { width, height } = useWindowDimensions();
  const { mode } = useAppearance();
  const banks = useMemo(() => makeSmogBanks(width, height), [width, height]);
  const active = useAmbientActive();

  // Light mint UI needs stronger/cooler mist or white fog disappears into the bg.
  const color =
    mode === APPEARANCE_RANDOM
      ? 'rgba(236, 248, 255, 0.48)'
      : mode === APPEARANCE_DARK
        ? 'rgba(186, 230, 253, 0.34)'
        : 'rgba(255, 255, 255, 0.78)';

  return (
    <View style={styles.layer} pointerEvents="none">
      {banks.map((bank) => (
        <SmogBank key={bank.id} {...bank} color={color} active={active} />
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
