import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const COLORS = ['#facc15', '#fbbf24', '#f59e0b', '#fb923c', '#fdba74', '#fff7ed', '#fef08a', '#fca5a5'];

function buildSparks(burstId, count = 18) {
  const sparks = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + ((burstId % 7) * 0.08);
    const dist = 28 + ((burstId + i * 17) % 26);
    const isStar = i % 3 === 0;
    sparks.push({
      id: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      delay: 40 + i * 18,
      size: isStar ? 10 + (i % 3) : 3 + (i % 4),
      color: COLORS[(burstId + i) % COLORS.length],
      isStar,
      rotate: ((burstId + i * 37) % 180) - 90,
    });
  }
  return sparks;
}

function Spark({ spark, burstId }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      spark.delay,
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) })
    );
  }, [burstId, spark.delay, spark.id, progress]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / 0.9),
      transform: [
        { translateX: spark.dx * t },
        { translateY: spark.dy * t - 6 * t * t },
        { rotate: `${spark.rotate * t}deg` },
        { scale: 0.5 + 0.85 * (1 - t) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.spark,
        {
          width: spark.size,
          height: spark.isStar ? spark.size : spark.size * 0.55,
          borderRadius: 2,
          backgroundColor: spark.isStar ? 'transparent' : spark.color,
          shadowColor: spark.color,
        },
        style,
      ]}
    >
      {spark.isStar ? (
        <Text style={[styles.star, { fontSize: spark.size, color: spark.color }]}>✦</Text>
      ) : null}
    </Animated.View>
  );
}

/**
 * Small radial firecracker burst. Bump `burstId` to replay.
 */
export default function FirecrackerFlare({ burstId = 0, visible = false }) {
  const sparks = useMemo(
    () => (visible && burstId > 0 ? buildSparks(burstId) : []),
    [visible, burstId]
  );

  if (!sparks.length) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      {sparks.map((spark) => (
        <Spark key={`${burstId}-${spark.id}`} spark={spark} burstId={burstId} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
    overflow: 'visible',
  },
  spark: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  star: {
    fontWeight: '900',
    textShadowColor: 'rgba(250, 204, 21, 0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
