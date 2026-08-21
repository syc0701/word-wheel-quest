import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SHOW_MS = 1600;
const CIRCLE = 280;

/**
 * Brief full-screen congrats after the player swipes the clue in the tutorial.
 * Message only — auto-dismisses, no buttons. Text is centered inside a circle.
 */
export default function OnboardingSuccessOverlay({ visible, t, onDone }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.72)).current;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.72);
      return undefined;
    }

    let dismissed = false;
    const finish = () => {
      if (dismissed) return;
      dismissed = true;
      doneRef.current?.();
    };

    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(SHOW_MS),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) finish();
    });

    const fallback = setTimeout(finish, SHOW_MS + 900);
    return () => {
      clearTimeout(fallback);
      dismissed = true;
    };
  }, [visible, opacity, scale]);

  if (!visible) return null;

  return (
    <View style={styles.fill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <LinearGradient
          colors={['rgba(2, 18, 28, 0.78)', 'rgba(6, 40, 48, 0.9)', 'rgba(2, 12, 20, 0.95)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.centerWrap, { opacity, transform: [{ scale }] }]}>
        <View style={styles.circle}>
          <Text style={styles.kicker}>{t('onboarding.success.kicker')}</Text>
          <Text style={styles.title}>{t('onboarding.success.title')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.success.subtitle')}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    elevation: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(15, 118, 110, 0.42)',
    borderWidth: 3,
    borderColor: 'rgba(94, 234, 212, 0.85)',
    shadowColor: '#2dd4bf',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  kicker: {
    color: '#99f6e4',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -0.6,
    textAlign: 'center',
    textShadowColor: 'rgba(45, 212, 191, 0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  subtitle: {
    marginTop: 12,
    color: 'rgba(248, 250, 252, 0.95)',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
});
