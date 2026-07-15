import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
const FALLBACK_GRADIENT = ['rgba(14, 116, 144, 0.55)', 'rgba(8, 47, 73, 0.85)'];

export default function SwipeableClueStrip({
  text,
  canSwipe,
  onSwipe,
  backgroundColor,
  gradientColors,
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
  const colors =
    Array.isArray(gradientColors) && gradientColors.length >= 2
      ? gradientColors
      : backgroundColor
        ? [backgroundColor, backgroundColor]
        : FALLBACK_GRADIENT;

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
      style={[styles.clueBoxWrap, active ? styles.clueBoxActive : null]}
      onLayout={(e) => {
        cardWidth.value = e.nativeEvent.layout.width;
      }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.clueBox, { borderColor }]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)', 'transparent']}
          locations={[0, 0.35, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sheen}
          pointerEvents="none"
        />
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.card, cardStyle]} pointerEvents={active ? 'none' : 'auto'}>
            {active ? (
              <View style={styles.clueRowPlaceholder} />
            ) : (
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
            )}
          </Animated.View>
        </GestureDetector>
        {overlay ? <View style={styles.overlaySlot}>{overlay}</View> : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  clueBoxWrap: {
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  clueBox: {
    borderRadius: 16,
    borderWidth: 1.2,
    minHeight: 54,
    paddingHorizontal: 6,
    paddingVertical: 12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  clueBoxActive: {
    minHeight: 62,
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    zIndex: 1,
  },
  overlaySlot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  clueRowPlaceholder: {
    minHeight: 36,
    width: '100%',
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
