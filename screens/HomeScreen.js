import { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Sparkles, Grid3x3 } from 'lucide-react-native';
import { COLORS, SCREENS } from '../constants/theme';

const { width } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pulsing ambient glow behind a menu button.
 */
function GlowOrb({ color, size, style }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.25, 0.65]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.92, 1.08]) }],
  }));

  return (
    <Animated.View
      style={[
        styles.glowOrb,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        glowStyle,
        style,
      ]}
    />
  );
}

/**
 * Large stylized menu button with scale-up press feedback.
 */
function MenuButton({ title, subtitle, icon: Icon, glowColor, onPress }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(1.04, { damping: 12, stiffness: 280 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 320 });
  };

  return (
    <View style={styles.menuButtonWrap}>
      <GlowOrb color={glowColor} size={width * 0.55} style={styles.glowBehind} />
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.menuButton, animatedStyle]}
      >
        <View style={[styles.iconCircle, { borderColor: glowColor }]}>
          <Icon color={COLORS.text} size={36} strokeWidth={1.8} />
        </View>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </AnimatedPressable>
    </View>
  );
}

export default function HomeScreen({ navigate }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>PUZZLE COLLECTION</Text>
        <Text style={styles.title}>Word Wheel Quest</Text>
        <Text style={styles.tagline}>Swipe letters. Slide blocks. Master both.</Text>
      </View>

      <View style={styles.menuStack}>
        <MenuButton
          title="Word Wheel"
          subtitle="Connect letters in the circle"
          icon={Sparkles}
          glowColor={COLORS.primaryGlow}
          onPress={() => navigate(SCREENS.WORD_WHEEL)}
        />
        <MenuButton
          title="Block Jam"
          subtitle="Slide the red block to the exit"
          icon={Grid3x3}
          glowColor={COLORS.accentGlow}
          onPress={() => navigate(SCREENS.BLOCK_JAM)}
        />
      </View>

      <Text style={styles.footer}>Ready to play — no login required</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  kicker: {
    color: COLORS.accent,
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: '700',
    marginBottom: 10,
  },
  title: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
  },
  menuStack: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
  },
  menuButtonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowBehind: {
    position: 'absolute',
  },
  glowOrb: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 12,
  },
  menuButton: {
    width: width - 48,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
    marginBottom: 14,
  },
  menuTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  menuSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 6,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
