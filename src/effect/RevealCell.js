import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { WW } from '../constants/theme';

const SPRING_POP = { damping: 8, stiffness: 280, mass: 0.55 };
const SPRING_SETTLE = { damping: 12, stiffness: 180, mass: 0.7 };

/**
 * Grid cell bounce / pulse when a word is newly found or re-selected (already revealed).
 * `mode`: 'new' | 'already'
 * `pulseKey`: bump to re-run animation for the same cell.
 */
export default function RevealCell({
  size,
  letter,
  wordNumber,
  isHint,
  isSelected,
  celebrate,
  mode = 'new',
  pulseKey = 0,
  celebrateDelay = 0,
  onPress,
}) {
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (!celebrate) {
      scale.value = withTiming(1, { duration: 160 });
      lift.value = withTiming(0, { duration: 160 });
      glow.value = withTiming(0, { duration: 160 });
      return;
    }

    if (mode === 'already') {
      // Soft “already found” pulse — clear feedback without full celebration.
      scale.value = withDelay(
        celebrateDelay,
        withSequence(
          withTiming(1.12, { duration: 120, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 220, easing: Easing.inOut(Easing.cubic) }),
          withTiming(1.08, { duration: 120, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 200, easing: Easing.inOut(Easing.cubic) })
        )
      );
      lift.value = withDelay(
        celebrateDelay,
        withSequence(
          withTiming(-3, { duration: 120 }),
          withTiming(0, { duration: 220 })
        )
      );
      glow.value = withDelay(
        celebrateDelay,
        withSequence(
          withTiming(1, { duration: 140 }),
          withTiming(0.35, { duration: 280 }),
          withTiming(0.85, { duration: 140 }),
          withTiming(0, { duration: 280 })
        )
      );
      return;
    }

    scale.value = withDelay(
      celebrateDelay,
      withSequence(
        withSpring(1.28, SPRING_POP),
        withSpring(0.94, SPRING_SETTLE),
        withSpring(1.08, SPRING_SETTLE),
        withSpring(1, SPRING_SETTLE)
      )
    );
    lift.value = withDelay(
      celebrateDelay,
      withSequence(withSpring(-6, SPRING_POP), withSpring(0, SPRING_SETTLE))
    );
    glow.value = withDelay(
      celebrateDelay,
      withSequence(withTiming(1, { duration: 100 }), withTiming(0, { duration: 700 }))
    );
  }, [celebrate, celebrateDelay, mode, pulseKey, scale, lift, glow]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: scale.value }],
    zIndex: celebrate ? 4 : 1,
    shadowOpacity: 0.2 + glow.value * 0.45,
    shadowRadius: 4 + glow.value * 8,
  }));

  return (
    <Animated.View
      style={[
        { width: size, height: size },
        mode === 'already' ? styles.shadowAlready : styles.shadowNew,
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        style={[
          styles.cell,
          { width: size, height: size },
          isHint ? styles.cellHint : styles.cellFound,
          isSelected && styles.cellSelected,
          celebrate && (mode === 'already' ? styles.cellAlready : styles.cellCelebrate),
        ]}
      >
        {wordNumber != null && (
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{wordNumber}</Text>
          </View>
        )}
        {letter ? (
          <Text style={[styles.letter, isHint && styles.letterHint]}>{letter}</Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowNew: {
    shadowColor: '#facc15',
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  shadowAlready: {
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    position: 'relative',
  },
  cellFound: {
    backgroundColor: WW.successSoft,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  cellHint: {
    backgroundColor: WW.hintSoft,
    borderWidth: 2,
    borderColor: '#fcd34d',
  },
  cellSelected: {
    borderColor: WW.accent,
  },
  cellCelebrate: {
    backgroundColor: '#d9f99d',
    borderColor: '#84cc16',
  },
  cellAlready: {
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
    borderWidth: 2.5,
  },
  letter: {
    fontSize: 16,
    fontWeight: '700',
    color: WW.successText,
  },
  letterHint: {
    color: WW.hintText,
  },
  numberBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    minWidth: 14,
    minHeight: 14,
    paddingHorizontal: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#064e3b',
  },
});
