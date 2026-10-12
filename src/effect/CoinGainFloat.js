import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const CONFETTI_COLORS = ['#F43F5E', '#38BDF8', '#A3E635', '#FB7185', '#67E8F9', '#FDBA74', '#C4B5FD'];

function buildConfetti(burstId) {
  const pieces = [];
  for (let i = 0; i < 16; i += 1) {
    const angle = ((i / 16) * 360 + (burstId * 17) % 20) * (Math.PI / 180);
    const dist = 28 + ((burstId + i * 5) % 18);
    pieces.push({
      id: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist * 0.72 - 10,
      delay: (i % 5) * 28,
      width: i % 3 === 0 ? 7 : 5,
      height: i % 2 === 0 ? 4 : 8,
      color: CONFETTI_COLORS[(burstId + i) % CONFETTI_COLORS.length],
      spin: ((burstId + i * 40) % 220) - 110,
    });
  }
  return pieces;
}

function ConfettiBit({ piece, burstId }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      piece.delay,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })
    );
  }, [burstId, piece.delay, piece.id, progress]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.55) / 0.45),
      transform: [
        { translateX: piece.dx * t },
        { translateY: piece.dy * t + 18 * t * t },
        { rotate: `${piece.spin * t}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bit,
        {
          width: piece.width,
          height: piece.height,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

/**
 * Plain "+2" that pops above the coin icon, holds, then fades.
 * Confetti bursts from the number. Bump `burstId` to replay.
 */
export default function CoinGainFloat({ amount = 0, burstId = 0 }) {
  const progress = useSharedValue(0);
  const pieces = useMemo(
    () => (amount && burstId ? buildConfetti(burstId) : []),
    [amount, burstId]
  );

  useEffect(() => {
    if (!amount || !burstId) return undefined;
    progress.value = 0;
    progress.value = withSequence(
      withTiming(0.2, { duration: 180, easing: Easing.out(Easing.cubic) }),
      withDelay(1000, withTiming(1, { duration: 420, easing: Easing.in(Easing.cubic) }))
    );
    return undefined;
  }, [amount, burstId, progress]);

  const labelStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const appear = Math.min(t / 0.16, 1);
    const leave = t <= 0.2 ? 0 : (t - 0.2) / 0.8;
    return {
      opacity: appear * (1 - leave),
      transform: [
        { translateY: -8 - 36 * leave },
        { scale: 0.8 + 0.2 * appear },
      ],
    };
  });

  if (!amount || !burstId) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      {pieces.map((piece) => (
        <ConfettiBit key={`${burstId}-${piece.id}`} piece={piece} burstId={burstId} />
      ))}
      <Animated.Text style={[styles.text, labelStyle]}>{`+${amount}`}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: -18,
    zIndex: 9,
    width: 72,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bit: {
    position: 'absolute',
    borderRadius: 2,
  },
});
