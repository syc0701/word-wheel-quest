import { useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  InteractionManager,
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

const SPLASH_BG = require('../assets/icon_donut.png');
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

/**
 * Covers the cold-start gap with the cookie-wheel splash art.
 * No progress bar — leaves as soon as the background has loaded and
 * startup interactions settle (no fixed hold).
 */
export default function LaunchSplashOverlay({ onDone }) {
  const [visible, setVisible] = useState(true);
  const [bgReady, setBgReady] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const { width, height } = useWindowDimensions();
  const banks = useMemo(() => makeMistBanks(6, width, height), [width, height]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setAppReady(true);
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (!visible || !bgReady || !appReady) return;
    setVisible(false);
    onDone?.();
  }, [visible, bgReady, appReady, onDone]);

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
        onLoad={() => setBgReady(true)}
        onError={() => setBgReady(true)}
      >
        <LinearGradient
          colors={[
            'rgba(61, 35, 20, 0.38)',
            'rgba(61, 35, 20, 0.12)',
            'rgba(61, 35, 20, 0.2)',
            'rgba(61, 35, 20, 0.45)',
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
          <View style={styles.center} />
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
    backgroundColor: '#E8D4B8',
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
