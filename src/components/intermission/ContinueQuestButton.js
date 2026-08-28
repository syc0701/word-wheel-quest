import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Coins } from 'lucide-react-native';
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
 * Warm terracotta→chocolate pill CTA. Optional coin reward chip near the label.
 */
export default function ContinueQuestButton({
  label,
  onPress,
  accessibilityLabel,
  rewardCoins = null,
}) {
  const shineX = useSharedValue(-120);
  const pressScale = useSharedValue(1);
  const showReward = Number(rewardCoins) > 0;

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
            start={{ x: 0.05, y: 0 }}
            end={{ x: 0.95, y: 1 }}
            style={styles.oval}
          >
            <View style={styles.pearlHighlight} />
            <Animated.View style={[styles.shine, shineStyle]} />
            <View style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              {showReward ? (
                <View style={styles.coinChip}>
                  <Coins size={14} color="#FFF8E7" strokeWidth={2.4} />
                  <Text style={styles.coinChipText}>+{Math.floor(Number(rewardCoins))}</Text>
                </View>
              ) : null}
            </View>
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
    shadowColor: '#5C2E12',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  oval: {
    minHeight: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 18,
  },
  pearlHighlight: {
    position: 'absolute',
    top: 3,
    left: 18,
    right: 18,
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 42,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    fontFamily: INTERMISSION.displayBold,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: INTERMISSION.buttonText,
    textShadowColor: 'rgba(50, 20, 5, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  coinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(40, 18, 6, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255, 236, 179, 0.45)',
  },
  coinChipText: {
    fontFamily: INTERMISSION.displayBold,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF4D6',
  },
});
