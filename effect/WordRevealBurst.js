import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const CONFETTI_COLORS = [
  '#f472b6',
  '#fb7185',
  '#a78bfa',
  '#60a5fa',
  '#34d399',
  '#fbbf24',
  '#f97316',
  '#2dd4bf',
];

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function buildParticles(origins, burstId) {
  const particles = [];
  origins.forEach((origin, oi) => {
    const base = hashSeed(`${burstId}-${origin.key}`);
    for (let i = 0; i < 10; i += 1) {
      const angle = ((base + i * 37) % 360) * (Math.PI / 180);
      const dist = 28 + ((base + i * 17) % 42);
      const isStar = i % 3 === 0;
      particles.push({
        id: `${origin.key}-${i}`,
        x: origin.x,
        y: origin.y,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 18,
        delay: oi * 40 + i * 18,
        size: isStar ? 10 + (i % 3) * 2 : 5 + (i % 4),
        color: isStar ? '#facc15' : CONFETTI_COLORS[(base + i) % CONFETTI_COLORS.length],
        isStar,
        rotate: ((base + i * 23) % 180) - 90,
      });
    }
  });
  return particles;
}

function BurstParticle({ particle }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) })
    );
  }, [particle.delay, particle.id, progress]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85,
      transform: [
        { translateX: particle.dx * t },
        { translateY: particle.dy * t + 18 * t * t },
        { rotate: `${particle.rotate * t}deg` },
        { scale: 0.6 + 0.6 * (1 - t) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: particle.x - particle.size / 2,
          top: particle.y - particle.size / 2,
          width: particle.size,
          height: particle.isStar ? particle.size : particle.size * 0.55,
          borderRadius: particle.isStar ? 2 : 2,
          backgroundColor: particle.isStar ? 'transparent' : particle.color,
        },
        style,
      ]}
    >
      {particle.isStar ? (
        <Text style={[styles.star, { fontSize: particle.size, color: particle.color }]}>★</Text>
      ) : null}
    </Animated.View>
  );
}

/**
 * Confetti + glowing star burst over revealed word cells.
 * `origins` = [{ key, x, y }] in grid-local coordinates.
 */
export default function WordRevealBurst({ origins = [], burstId = 0 }) {
  const particles = useMemo(
    () => (origins.length ? buildParticles(origins, burstId) : []),
    [origins, burstId]
  );

  if (!particles.length) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <BurstParticle key={`${burstId}-${p.id}`} particle={p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    fontWeight: '900',
    textShadowColor: 'rgba(250, 204, 21, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
