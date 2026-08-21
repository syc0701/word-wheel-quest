import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { formatCellWordNumberLabel } from '../lib/gridReveal';
import { GRID_CREAM, GRID_TRANSITION_MS } from '../lib/gridTheme';

const SPRING_POP = { damping: 8, stiffness: 280, mass: 0.55 };
const SPRING_SETTLE = { damping: 12, stiffness: 180, mass: 0.7 };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const selectedProgress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    selectedProgress.value = withTiming(isSelected ? 1 : 0, {
      duration: GRID_TRANSITION_MS,
      easing: Easing.inOut(Easing.quad),
    });
  }, [isSelected, selectedProgress]);

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
        withSequence(withTiming(-3, { duration: 120 }), withTiming(0, { duration: 220 }))
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

  const cellStyle = useAnimatedStyle(() => {
    const celebrating = celebrate;
    const celebrateBg =
      mode === 'already' ? GRID_CREAM.alreadyBg : GRID_CREAM.celebrateBg;
    const celebrateBorder =
      mode === 'already' ? GRID_CREAM.alreadyBorder : GRID_CREAM.celebrateBorder;
    const idleBg = celebrating
      ? celebrateBg
      : isHint
        ? GRID_CREAM.hintBg
        : GRID_CREAM.revealedBg;
    const idleBorder = celebrating
      ? celebrateBorder
      : isHint
        ? GRID_CREAM.hintBorder
        : GRID_CREAM.revealedBorder;
    const idleWidth = celebrating && mode === 'already' ? 2.5 : GRID_CREAM.cellBorderWidth;
    return {
      backgroundColor: interpolateColor(
        selectedProgress.value,
        [0, 1],
        [idleBg, GRID_CREAM.selectedBg]
      ),
      borderColor: interpolateColor(
        selectedProgress.value,
        [0, 1],
        [idleBorder, GRID_CREAM.selectedBorder]
      ),
      borderWidth:
        idleWidth +
        selectedProgress.value * (GRID_CREAM.selectedBorderWidth - idleWidth),
    };
  }, [celebrate, isHint, mode]);

  const wordNumberLabel = formatCellWordNumberLabel(wordNumber);
  const textColor = isSelected
    ? GRID_CREAM.selectedText
    : isHint
      ? GRID_CREAM.hintText
      : GRID_CREAM.revealedText;

  return (
    <Animated.View
      style={[
        { width: size, height: size },
        mode === 'already' ? styles.shadowAlready : styles.shadowNew,
        animatedStyle,
      ]}
    >
      <AnimatedPressable
        onPress={onPress}
        style={[styles.cell, { width: size, height: size }, cellStyle]}
      >
        {wordNumberLabel ? (
          <View style={[styles.numberBadge, wordNumberLabel.length > 2 && styles.numberBadgeWide]}>
            <Text style={[styles.numberText, wordNumberLabel.length > 2 && styles.numberTextCompact]}>
              {wordNumberLabel}
            </Text>
          </View>
        ) : null}
        {letter ? <Text style={[styles.letter, { color: textColor }]}>{letter}</Text> : null}
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowNew: {
    shadowColor: GRID_CREAM.selectedBorder,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  shadowAlready: {
    shadowColor: GRID_CREAM.cellBorder,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    position: 'relative',
  },
  letter: {
    fontSize: 17,
    fontWeight: '900',
  },
  numberBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    minWidth: 18,
    minHeight: 18,
    paddingHorizontal: 3,
    borderRadius: 5,
    backgroundColor: GRID_CREAM.badgeBg,
    borderWidth: 1,
    borderColor: GRID_CREAM.badgeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeWide: {
    minWidth: 26,
    paddingHorizontal: 4,
  },
  numberText: {
    fontSize: 12,
    fontWeight: '800',
    color: GRID_CREAM.badgeText,
  },
  numberTextCompact: {
    fontSize: 10,
    letterSpacing: -0.2,
  },
});
