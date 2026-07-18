import { useEffect, useState } from 'react';
import {
  Image,
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SPLASH_BG = require('../assets/splash-launch.png');
const COPYRIGHT = '© 2026 Puzzle Interact';
const SPLASH_FALLBACK = '#E8D4B8';

/**
 * Bridges native launch → first screen.
 * Solid fallback color shows immediately so a stale cached launch image
 * cannot peek through while the new splash bitmap loads.
 */
export default function LaunchSplashOverlay({ onDone }) {
  const [visible, setVisible] = useState(true);
  const [bgReady, setBgReady] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setAppReady(true);
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (!visible || !bgReady || !appReady) return;
    // Brief hold so native → JS handoff does not flash home underneath.
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 180);
    return () => clearTimeout(t);
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
      <LinearGradient
        colors={['#fff8ed', '#efdcc2', '#d6b88e']}
        locations={[0, 0.52, 1]}
        style={styles.background}
      >
        <Text style={styles.title}>Word Wheel Quest</Text>
        <View style={styles.logoArea}>
          <Image
          source={SPLASH_BG}
          style={styles.logo}
          resizeMode="contain"
          onLoad={() => setBgReady(true)}
          onError={() => setBgReady(true)}
          />
        </View>
        <Text style={styles.copyright}>{COPYRIGHT}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_FALLBACK,
    zIndex: 9999,
    elevation: 9999,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: SPLASH_FALLBACK,
    paddingHorizontal: 24,
    paddingTop: 96,
    paddingBottom: 44,
  },
  title: {
    color: '#5B351F',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 280,
    height: 280,
    borderRadius: 44,
  },
  copyright: {
    color: 'rgba(91, 53, 31, 0.72)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.15,
    textAlign: 'center',
    lineHeight: 18,
  },
});
