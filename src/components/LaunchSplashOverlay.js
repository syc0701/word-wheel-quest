import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/** Splash duration before entering the app. */
export const LAUNCH_SPLASH_HOLD_MS = 3_000;

const SPLASH_BG = require('../assets/bg_image/deep_sea.png');
const COPYRIGHT = '© 2026 Puzzle Interact. All rights reserved.';

function makeMistBanks(count, screenW, screenH) {
  return Array.from({ length: count }, (_, i) => {
    const size = screenW * (0.07 + (i % 3) * 0.025);
    const goingRight = i % 2 === 0;
    const inLower = i % 3 !== 0;
    return {
      id: i,
      size,
      top: inLower
        ? screenH * (0.64 + ((i * 9) % 26) / 100) - size * 0.2
        : screenH * (0.05 + ((i * 7) % 10) / 100),
      duration: 20000 + (i % 4) * 4000,
      delay: (i % 5) * 1200,
      goingRight,
      opacity: 0.1 + (i % 3) * 0.03,
    };
  });
}

function MistOrb({ size, top, duration, delay, goingRight, opacity, screenW }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false)
    );
  }, [progress, duration, delay]);

  const startX = goingRight ? -size * 0.5 : screenW - size * 0.5;
  const endX = goingRight ? screenW - size * 0.5 : -size * 0.5;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.15, 0.5, 0.85, 1],
      [0, opacity, opacity, opacity * 0.85, 0]
    ),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [startX, endX]) },
      {
        translateY: interpolate(
          progress.value,
          [0, 0.5, 1],
          [0, goingRight ? -5 : 5, 0]
        ),
      },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.mistOrb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          top,
        },
        animatedStyle,
      ]}
    />
  );
}

function LoadingBar({ durationMs, trackWidth }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: durationMs,
      easing: Easing.linear,
    });
  }, [progress, durationMs]);

  const fillStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, trackWidth]),
  }));

  return (
    <View style={[styles.barTrack, { width: trackWidth }]}>
      <Animated.View style={[styles.barFill, fillStyle]} />
    </View>
  );
}

/**
 * Launch splash: cover background, centered icon, loading bar, copyright.
 * Tap anywhere to dismiss early.
 */
export default function LaunchSplashOverlay({ onDone, holdMs = LAUNCH_SPLASH_HOLD_MS }) {
  const [visible, setVisible] = useState(true);
  const { width, height } = useWindowDimensions();
  const iconSize = Math.round(width * 0.42);
  const barWidth = Math.min(220, Math.round(width * 0.55));
  const banks = useMemo(() => makeMistBanks(6, width, height), [width, height]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, holdMs);
    return () => clearTimeout(timer);
  }, [holdMs, onDone]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    onDone?.();
  };

  return (
    <Pressable
      style={styles.root}
      onPress={dismiss}
      accessibilityRole="button"
      accessibilityLabel="Dismiss launch screen"
    >
      <ImageBackground
        source={SPLASH_BG}
        style={styles.background}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(6, 32, 38, 0.42)',
            'rgba(6, 32, 38, 0.18)',
            'rgba(6, 32, 38, 0.28)',
            'rgba(6, 32, 38, 0.5)',
          ]}
          locations={[0, 0.35, 0.7, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.mistLayer} pointerEvents="none">
          {banks.map((bank) => (
            <MistOrb key={bank.id} {...bank} screenW={width} />
          ))}
        </View>
        <View style={styles.content} pointerEvents="box-none">
          <Text style={styles.title}>Word Wheel Quest</Text>
          <View style={styles.center}>
            <Image
              source={require('../assets/splash-icon.png')}
              style={{ width: iconSize, height: iconSize }}
              resizeMode="contain"
            />
            <LoadingBar durationMs={holdMs} trackWidth={barWidth} />
          </View>
          <Text style={styles.copyright}>{COPYRIGHT}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  mistLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  mistOrb: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 108,
    paddingBottom: 44,
  },
  title: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
    marginTop: 28,
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#5eead4',
  },
  copyright: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.15,
    textAlign: 'center',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
