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

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function makeSmogBanks(count = 8) {
  return Array.from({ length: count }, (_, i) => {
    const size = SCREEN_W * (0.18 + (i % 4) * 0.05);
    const goingRight = i % 2 === 0;
    return {
      id: i,
      size,
      top: SCREEN_H * (0.05 + ((i * 17) % 80) / 100) - size * 0.2,
      duration: 16000 + (i % 5) * 4500,
      delay: (i % 6) * 1200,
      goingRight,
      opacity: 0.14 + (i % 4) * 0.04,
    };
  });
}

function SmogBank({ size, top, duration, delay, goingRight, opacity }) {
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

  const startX = goingRight ? -size : SCREEN_W;
  const endX = goingRight ? SCREEN_W : -size;

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
          [0, goingRight ? -14 : 14, 0]
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
        },
        animatedStyle,
      ]}
    />
  );
}

export default function HomeSmogEffect() {
  const banks = useMemo(() => makeSmogBanks(8), []);

  return (
    <View style={styles.layer} pointerEvents="none">
      {banks.map((bank) => (
        <SmogBank key={bank.id} {...bank} />
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
    backgroundColor: 'rgba(255, 250, 247, 0.5)',
  },
});
