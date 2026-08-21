import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const START_SIZE = 168;

/**
 * Friendly welcome gate before tutorial Step 1.
 */
export default function OnboardingWelcomeOverlay({ visible, t, onStart, onSkip }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.82)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.82);
      pulse.setValue(1);
      return undefined;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, opacity, scale, pulse]);

  if (!visible) return null;

  return (
    <View style={styles.fill} pointerEvents="auto">
      <LinearGradient
        colors={['rgba(2, 18, 28, 0.82)', 'rgba(6, 40, 48, 0.92)', 'rgba(2, 12, 20, 0.96)']}
        style={StyleSheet.absoluteFill}
      />

      {onSkip ? (
        <Pressable
          style={styles.skipBtn}
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.skip')}
        >
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </Pressable>
      ) : null}

      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.kicker}>{t('onboarding.welcome.kicker')}</Text>
        <Text style={styles.title}>{t('onboarding.welcome.title')}</Text>
        <Text style={styles.body}>{t('onboarding.welcome.body')}</Text>

        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Pressable
            style={styles.startCircle}
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.welcome.start')}
          >
            <Text style={styles.startText}>{t('onboarding.welcome.start')}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 55,
    elevation: 55,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 16,
    zIndex: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  skipText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  content: {
    alignItems: 'center',
    maxWidth: 360,
  },
  kicker: {
    color: '#5eead4',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 14,
  },
  body: {
    color: 'rgba(248, 250, 252, 0.9)',
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 36,
  },
  startCircle: {
    width: START_SIZE,
    height: START_SIZE,
    borderRadius: START_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14b8a6',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.88)',
    shadowColor: '#2dd4bf',
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  startText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});
