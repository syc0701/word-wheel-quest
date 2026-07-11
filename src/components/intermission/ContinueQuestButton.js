import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { INTERMISSION } from './intermissionTheme';

/**
 * Sculpted pearlescent teal oval with gold rim + sweeping shine.
 */
export default function ContinueQuestButton({ label, onPress, accessibilityLabel }) {
  const shineX = useSharedValue(-120);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    shineX.value = withDelay(
      400,
      withRepeat(
        withTiming(280, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        -1,
        false
      )
    );
  }, [shineX]);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineX.value }, { skewX: '-18deg' }],
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, pressStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          pressScale.value = withTiming(0.97, { duration: 90 });
        }}
        onPressOut={() => {
          pressScale.value = withTiming(1, { duration: 140 });
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        style={styles.pressable}
      >
        <View style={styles.rim}>
          <LinearGradient
            colors={INTERMISSION.button}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.oval}
          >
            <View style={styles.pearlHighlight} />
            <Animated.View style={[styles.shine, shineStyle]} />
            <Text style={styles.label}>{label}</Text>
          </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
    width: '100%',
  },
  pressable: {
    width: '100%',
  },
  rim: {
    borderRadius: 999,
    padding: 2.5,
    backgroundColor: INTERMISSION.buttonRim,
    shadowColor: '#0f3d36',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
  oval: {
    minHeight: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  pearlHighlight: {
    position: 'absolute',
    top: 3,
    left: 18,
    right: 18,
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 42,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  label: {
    fontFamily: INTERMISSION.serifBold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: INTERMISSION.buttonText,
    textShadowColor: 'rgba(0,40,35,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
