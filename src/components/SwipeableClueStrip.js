import { useCallback, useEffect, useRef } from 'react';
import { Animated as RNAnimated, Easing as RNEasing, Platform, StyleSheet, Text, View } from 'react-native';
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
import { ChevronLeft, ChevronRight, Search } from 'lucide-react-native';

const SWIPE_THRESHOLD = 56;
const EXIT_MS = 220;
const ENTER_MS = 240;

const CREAM = '#FBF6EA';
const ORANGE = '#E8943A';
const CLUE_TEXT = '#3F2A1A';
const CLUE_MUTED = 'rgba(63, 42, 26, 0.55)';

function FlickerSwipeArrow({ side }) {
  const opacity = useRef(new RNAnimated.Value(1)).current;
  const shift = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const flicker = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, {
          toValue: 0.2,
          duration: 380,
          easing: RNEasing.inOut(RNEasing.quad),
          useNativeDriver: true,
        }),
        RNAnimated.timing(opacity, {
          toValue: 1,
          duration: 380,
          easing: RNEasing.inOut(RNEasing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const nudge = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(shift, {
          toValue: side === 'left' ? -4 : 4,
          duration: 420,
          easing: RNEasing.inOut(RNEasing.quad),
          useNativeDriver: true,
        }),
        RNAnimated.timing(shift, {
          toValue: 0,
          duration: 420,
          easing: RNEasing.inOut(RNEasing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    flicker.start();
    nudge.start();
    return () => {
      flicker.stop();
      nudge.stop();
    };
  }, [opacity, shift, side]);

  const Icon = side === 'left' ? ChevronLeft : ChevronRight;

  return (
    <RNAnimated.View
      pointerEvents="none"
      style={[
        styles.swipeArrow,
        side === 'left' ? styles.swipeArrowLeft : styles.swipeArrowRight,
        {
          opacity,
          transform: [{ translateX: shift }],
        },
      ]}
    >
      <Icon color="#fff" size={22} strokeWidth={3} />
    </RNAnimated.View>
  );
}

export default function SwipeableClueStrip({
  text,
  canSwipe,
  onSwipe,
  placeholder,
  prevA11y,
  nextA11y,
  active,
  overlay,
  cardRef,
  onCardLayout,
  showSwipeHints = false,
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
      style={styles.clueBoxWrap}
      onLayout={(e) => {
        cardWidth.value = e.nativeEvent.layout.width;
      }}
    >
      <View
        ref={cardRef}
        collapsable={false}
        style={styles.clueBox}
        onLayout={onCardLayout}
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.card, cardStyle]} pointerEvents={active ? 'none' : 'auto'}>
            {active ? (
              <View style={styles.clueRowPlaceholder} />
            ) : (
              <View
                style={[styles.clueRow, showSwipeHints && styles.clueRowWithHints]}
                accessibilityRole="text"
                accessibilityLabel={text}
                accessibilityHint={canSwipe ? `${prevA11y}. ${nextA11y}` : undefined}
              >
                <View style={styles.iconBadge}>
                  <Search color="#fff" size={18} strokeWidth={2.6} />
                </View>
                <Text
                  style={[
                    styles.clueText,
                    placeholder ? styles.cluePlaceholder : null,
                  ]}
                  numberOfLines={3}
                >
                  {text}
                </Text>
              </View>
            )}
          </Animated.View>
        </GestureDetector>
        {showSwipeHints ? (
          <>
            <FlickerSwipeArrow side="left" />
            <FlickerSwipeArrow side="right" />
          </>
        ) : null}
        {overlay ? <View style={styles.overlaySlot}>{overlay}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clueBoxWrap: {
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 22,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  clueBox: {
    borderRadius: 22,
    borderWidth: 4,
    borderColor: ORANGE,
    backgroundColor: CREAM,
    minHeight: 78,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    justifyContent: 'center',
    // Android clips children when borderRadius is set; keep padding large enough
    // that two-line clues never sit under the border edge.
    overflow: 'hidden',
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
    alignItems: 'flex-start',
    gap: 10,
  },
  clueRowWithHints: {
    paddingHorizontal: 28,
  },
  clueRowPlaceholder: {
    minHeight: 48,
    width: '100%',
  },
  swipeArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    zIndex: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  swipeArrowLeft: {
    left: -6,
  },
  swipeArrowRight: {
    right: -6,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: 2,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 3,
    elevation: 2,
  },
  clueText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
    color: CLUE_TEXT,
    textAlign: 'left',
    // Extra room for bold metrics on Android so line 2 isn’t cropped.
    paddingBottom: 2,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  cluePlaceholder: {
    color: CLUE_MUTED,
    fontWeight: '600',
  },
});
