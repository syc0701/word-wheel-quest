import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const SPARK_COLORS = ['#facc15', '#fbbf24', '#f59e0b', '#fb923c', '#fdba74', '#fff7ed', '#fef08a'];

function buildSparks(burstId) {
  const sparks = [];
  for (let i = 0; i < 14; i += 1) {
    const angle = (-105 + (i / 13) * 90 + ((burstId + i * 11) % 9) - 4) * (Math.PI / 180);
    const dist = 18 + ((burstId + i * 13) % 22);
    const isStar = i % 4 === 0;
    sparks.push({
      id: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 8,
      delay: i * 22,
      size: isStar ? 9 + (i % 2) : 3 + (i % 4),
      color: SPARK_COLORS[(burstId + i) % SPARK_COLORS.length],
      isStar,
      rotate: ((burstId + i * 29) % 160) - 80,
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
      withTiming(1, { duration: 640, easing: Easing.out(Easing.cubic) })
    );
  }, [burstId, spark.delay, spark.id, progress]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: t < 0.12 ? t / 0.12 : Math.max(0, 1 - (t - 0.12) / 0.88),
      transform: [
        { translateX: spark.dx * t },
        { translateY: spark.dy * t - 10 * t * t },
        { rotate: `${spark.rotate * t}deg` },
        { scale: 0.55 + 0.7 * (1 - t) },
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
 * Little gold firecracker / spark burst above the coin balance.
 * Bump `burstId` to replay.
 */
export default function CoinSparkBurst({ burstId = 0, visible = false }) {
  const sparks = useMemo(() => (visible && burstId > 0 ? buildSparks(burstId) : []), [visible, burstId]);

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
    position: 'absolute',
    left: 0,
    right: 0,
    top: -6,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
    overflow: 'visible',
  },
  spark: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 4,
  },
  star: {
    fontWeight: '900',
    textShadowColor: 'rgba(250, 204, 21, 0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});
