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

function makeBubbles(count = 10) {
  return Array.from({ length: count }, (_, i) => {
    const size = 18 + ((i * 17) % 52);
    return {
      id: i,
      size,
      left: ((i * 97 + 31) % 100) / 100 * (SCREEN_W - size),
      startY: SCREEN_H * (0.55 + ((i * 13) % 45) / 100),
      duration: 9000 + (i % 5) * 2200,
      delay: (i % 6) * 900,
      drift: ((i % 2 === 0 ? 1 : -1) * (12 + (i % 4) * 8)),
      opacity: 0.12 + (i % 4) * 0.05,
    };
  });
}

function FloatingBubble({ size, left, startY, duration, delay, drift, opacity }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [progress, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.08, 0.75, 1], [0, opacity, opacity * 0.85, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -(startY + size + 80)]) },
      { translateX: interpolate(progress.value, [0, 0.35, 0.7, 1], [0, drift, -drift * 0.4, drift * 0.6]) },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.85, 1.05, 0.9]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left,
          top: startY,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function PlayAmbientBubbles() {
  const bubbles = useMemo(() => makeBubbles(12), []);

  return (
    <View style={styles.layer} pointerEvents="none">
      {bubbles.map((bubble) => (
        <FloatingBubble key={bubble.id} {...bubble} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
});
