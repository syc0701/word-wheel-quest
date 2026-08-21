import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/** Keep play bubbles mostly in the lower area — below the grid. */
const PLAY_FLOOR_Y = SCREEN_H * 0.48;

function makePlayBubbles(count = 12) {
  return Array.from({ length: count }, (_, i) => {
    const size = 5 + ((i * 11) % 12);
    const startY = SCREEN_H * (0.62 + ((i * 13) % 32) / 100);
    const travel = Math.min(startY - PLAY_FLOOR_Y + size, 110 + (i % 5) * 22);
    return {
      id: i,
      size,
      left: (((i * 97 + 31) % 100) / 100) * (SCREEN_W - size),
      startY,
      travel: Math.max(56, travel),
      duration: 7000 + (i % 5) * 1600,
      delay: (i % 7) * 500,
      drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 4) * 6),
      opacity: 0.18 + (i % 4) * 0.06,
    };
  });
}

/** Larger, clearer orbs for home so motion reads over image backgrounds. */
function makeHomeBubbles(count = 10) {
  return Array.from({ length: count }, (_, i) => {
    const size = 18 + ((i * 17) % 28);
    const startY = SCREEN_H * (0.72 + ((i * 11) % 24) / 100);
    const travel = SCREEN_H * (0.42 + ((i % 4) * 0.06));
    return {
      id: i,
      size,
      left: (((i * 89 + 19) % 100) / 100) * Math.max(8, SCREEN_W - size),
      startY,
      travel,
      duration: 5200 + (i % 5) * 900,
      delay: (i % 6) * 420,
      drift: (i % 2 === 0 ? 1 : -1) * (18 + (i % 4) * 10),
      opacity: 0.28 + (i % 4) * 0.07,
    };
  });
}

function FloatingBubble({ size, left, startY, travel, duration, delay, drift, opacity, soft }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(progress);
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
  }, [progress, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.08, 0.65, 1], [0, opacity, opacity * 0.85, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -travel]) },
      {
        translateX: interpolate(
          progress.value,
          [0, 0.35, 0.7, 1],
          [0, drift, -drift * 0.45, drift * 0.55]
        ),
      },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.85, 1.08, 0.92]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        soft ? styles.bubbleSoft : styles.bubble,
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

/** Rising bubbles for home / play backdrops. */
export default function PlayAmbientBubbles({ variant = 'play' }) {
  const isHome = variant === 'home';
  const bubbles = useMemo(
    () => (isHome ? makeHomeBubbles(10) : makePlayBubbles(12)),
    [isHome]
  );

  return (
    <View style={styles.layer} pointerEvents="none">
      {bubbles.map((bubble) => (
        <FloatingBubble key={bubble.id} {...bubble} soft={isHome} />
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
  bubble: {
    position: 'absolute',
    zIndex: 0,
    elevation: 0,
    backgroundColor: 'rgba(224, 242, 254, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(186, 230, 253, 0.4)',
  },
  bubbleSoft: {
    position: 'absolute',
    zIndex: 0,
    elevation: 0,
    backgroundColor: 'rgba(255, 248, 238, 0.38)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
});
