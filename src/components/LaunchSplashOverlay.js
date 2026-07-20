import { useEffect, useState } from 'react';
import {
  Image,
  ImageBackground,
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const SPLASH_BG = require('../assets/splash-reef-bg.png');
const LOGO = require('../assets/splash-logo-word.png');
const SEA_FALLBACK = '#0A2A4A';
const COPYRIGHT = '© 2026 Puzzle Interact';

/**
 * Immersive reef launch: logo bounce-in, spaced title, animated rope progress.
 */
export default function LaunchSplashOverlay({ onDone }) {
  const [visible, setVisible] = useState(true);
  const [bgReady, setBgReady] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [nativeHidden, setNativeHidden] = useState(false);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.35);
  const progress = useSharedValue(0);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setAppReady(true);
    });
    const maxWait = setTimeout(() => {
      setBgReady(true);
      setAppReady(true);
    }, 2000);
    return () => {
      task.cancel();
      clearTimeout(maxWait);
    };
  }, []);

  // Hide native logo splash once the reef overlay is painted (failsafe timeout too).
  useEffect(() => {
    if (nativeHidden) return;
    if (!bgReady) {
      const failsafe = setTimeout(() => {
        SplashScreen.hideAsync()
          .catch(() => {})
          .finally(() => setNativeHidden(true));
      }, 2500);
      return () => clearTimeout(failsafe);
    }
    let cancelled = false;
    (async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // Native splash may already be gone.
      }
      if (!cancelled) setNativeHidden(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [bgReady, nativeHidden]);

  useEffect(() => {
    if (!bgReady) return;
    logoOpacity.value = withTiming(1, { duration: 280 });
    logoScale.value = withSequence(
      withTiming(1.08, { duration: 520, easing: Easing.out(Easing.cubic) }),
      withTiming(0.96, { duration: 160, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) })
    );
    progress.value = withDelay(
      280,
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.cubic) })
    );
  }, [bgReady, logoOpacity, logoScale, progress]);

  useEffect(() => {
    if (!visible || !bgReady || !appReady || !nativeHidden) return;
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2200);
    return () => clearTimeout(t);
  }, [visible, bgReady, appReady, nativeHidden, onDone]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const ropeFillStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [6, 100])}%`,
  }));

  if (!visible) return null;

  const dismiss = () => {
    SplashScreen.hideAsync().catch(() => {});
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
        resizeMode="cover"
        onLoad={() => setBgReady(true)}
        onError={() => setBgReady(true)}
      >
        <View style={styles.scrim} />

        <View style={styles.hero}>
          <Animated.View style={[styles.logoWrap, logoStyle]}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.delay(520).duration(420)}
            style={styles.title}
          >
            Word Wheel Quest
          </Animated.Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.ropeTrack}>
            <View style={styles.ropeInner}>
              <Animated.View style={[styles.ropeFill, ropeFillStyle]} />
            </View>
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
    backgroundColor: SEA_FALLBACK,
    zIndex: 9999,
    elevation: 9999,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: SEA_FALLBACK,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 18, 36, 0.22)',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  logoWrap: {
    width: 200,
    height: 200,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    marginTop: 64,
    color: '#F4E6C8',
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'serif',
    letterSpacing: 0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 14,
  },
  ropeTrack: {
    width: '100%',
    height: 22,
    borderRadius: 999,
    padding: 3,
    backgroundColor: 'rgba(92, 64, 40, 0.88)',
    borderWidth: 2,
    borderColor: 'rgba(196, 150, 90, 0.75)',
  },
  ropeInner: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(8, 28, 52, 0.85)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  ropeFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#E8B84A',
  },
  copyright: {
    color: 'rgba(244, 230, 200, 0.55)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
