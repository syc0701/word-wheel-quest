import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const SWIPE_THRESHOLD = 56;
const EXIT_MS = 220;
const ENTER_MS = 240;

export default function SwipeableClueStrip({
  text,
  canSwipe,
  onSwipe,
  backgroundColor,
  borderColor,
  textColor,
  placeholder,
  prevA11y,
  nextA11y,
  active,
  overlay,
}) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const cardWidth = useSharedValue(320);
  const animating = useSharedValue(0);

  useEffect(() => {
    if (animating.value === 0) {
      translateX.value = 0;
      opacity.value = 1;
    }
  }, [text, animating, opacity, translateX]);

  const finishSwipe = useCallback(
    (delta) => {
      onSwipe?.(delta);
      const width = Math.max(cardWidth.value, 280);
      translateX.value = delta > 0 ? width : -width;
      opacity.value = 0;
      translateX.value = withTiming(0, {
        duration: ENTER_MS,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(
        1,
        {
          duration: ENTER_MS,
          easing: Easing.out(Easing.cubic),
        },
        () => {
          animating.value = 0;
        }
      );
    },
    [animating, cardWidth, onSwipe, opacity, translateX]
  );

  const runExit = useCallback(
    (delta) => {
      if (!canSwipe || animating.value) return;
      animating.value = 1;
      const width = Math.max(cardWidth.value, 280);
      const exitX = delta > 0 ? -width : width;
      translateX.value = withTiming(exitX, {
        duration: EXIT_MS,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(
        0,
        {
          duration: EXIT_MS,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(finishSwipe)(delta);
          } else {
            animating.value = 0;
          }
        }
      );
    },
    [animating, canSwipe, cardWidth, finishSwipe, opacity, translateX]
  );

  const panGesture = Gesture.Pan()
    .enabled(!!canSwipe)
    .activeOffsetX([-14, 14])
    .failOffsetY([-18, 18])
    .onUpdate((e) => {
      if (animating.value) return;
      translateX.value = e.translationX;
      const width = Math.max(cardWidth.value, 280);
      opacity.value = interpolate(
        Math.abs(e.translationX),
        [0, width * 0.7],
        [1, 0.35],
        Extrapolation.CLAMP
      );
    })
    .onEnd((e) => {
      if (animating.value) return;
      const width = Math.max(cardWidth.value, 280);
      const shouldNext = e.translationX <= -SWIPE_THRESHOLD || e.velocityX < -700;
      const shouldPrev = e.translationX >= SWIPE_THRESHOLD || e.velocityX > 700;
      if (shouldNext) {
        animating.value = 1;
        translateX.value = withTiming(-width, {
          duration: EXIT_MS,
          easing: Easing.in(Easing.cubic),
        });
        opacity.value = withTiming(0, { duration: EXIT_MS }, (finished) => {
          if (finished) runOnJS(finishSwipe)(1);
          else animating.value = 0;
        });
      } else if (shouldPrev) {
        animating.value = 1;
        translateX.value = withTiming(width, {
          duration: EXIT_MS,
          easing: Easing.in(Easing.cubic),
        });
        opacity.value = withTiming(0, { duration: EXIT_MS }, (finished) => {
          if (finished) runOnJS(finishSwipe)(-1);
          else animating.value = 0;
        });
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
        opacity.value = withTiming(1, { duration: 160 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const width = Math.max(cardWidth.value, 280);
    const tilt = interpolate(
      translateX.value,
      [-width, 0, width],
      [-6, 0, 6],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${tilt}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <View
      style={[
        styles.clueBox,
        { backgroundColor, borderColor },
        active ? styles.clueBoxActive : null,
      ]}
      onLayout={(e) => {
        cardWidth.value = e.nativeEvent.layout.width;
      }}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.clueRow}>
            {canSwipe ? (
              <Pressable
                style={styles.clueArrowBtn}
                onPress={() => runExit(-1)}
                hitSlop={8}
                accessibilityLabel={prevA11y}
              >
                <ChevronLeft color={textColor} size={22} strokeWidth={2.4} />
              </Pressable>
            ) : (
              <View style={styles.clueArrowSpacer} />
            )}
            <Text
              style={[
                styles.clueText,
                { color: textColor },
                placeholder ? styles.cluePlaceholder : null,
              ]}
            >
              {text}
            </Text>
            {canSwipe ? (
              <Pressable
                style={styles.clueArrowBtn}
                onPress={() => runExit(1)}
                hitSlop={8}
                accessibilityLabel={nextA11y}
              >
                <ChevronRight color={textColor} size={22} strokeWidth={2.4} />
              </Pressable>
            ) : (
              <View style={styles.clueArrowSpacer} />
            )}
          </View>
        </Animated.View>
      </GestureDetector>
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  clueBox: {
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 52,
    paddingHorizontal: 6,
    paddingVertical: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  clueBoxActive: {
    minHeight: 60,
  },
  card: {
    width: '100%',
  },
  clueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  clueArrowBtn: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clueArrowSpacer: {
    width: 8,
  },
  clueText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  cluePlaceholder: {
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
