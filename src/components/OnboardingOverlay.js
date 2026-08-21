import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';
import { Info } from 'lucide-react-native';

const STEPS = [
  { key: 'clue', textKey: 'onboarding.step.clue', focus: 'clue', fullWidth: true },
  { key: 'wheel', textKey: 'onboarding.step.wheel', focus: 'wheel', circular: true, circleBoost: 6 },
  { key: 'hint', textKey: 'onboarding.step.hint', focus: 'hint', circular: true, circleBoost: 22 },
  { key: 'letter', textKey: 'onboarding.step.letter', focus: 'letter', circular: true, circleBoost: 28 },
];

const PAD = 10;
const DIM = 'rgba(0, 0, 0, 0.62)';
const INFO_SIZE = 34;

/**
 * Dim everything except a clear hole (full-width band, circle, or rectangle).
 */
function SpotlightMask({ hole, width: W, height: H, fullWidth, circular, circleBoost = 0, maskId = 'onboardingHole' }) {
  if (!hole || hole.height <= 0 || W <= 0 || H <= 0) {
    return <View pointerEvents="none" style={[styles.dimFull, { backgroundColor: DIM }]} />;
  }

  if (fullWidth) {
    const top = Math.max(0, hole.y - PAD);
    const bottom = Math.min(H, hole.y + hole.height + PAD);
    return (
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, top: 0, right: 0, height: top, backgroundColor: DIM }}
        />
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, top: bottom, right: 0, bottom: 0, backgroundColor: DIM }}
        />
      </View>
    );
  }

  if (circular) {
    const cx = hole.x + hole.width / 2;
    const cy = hole.y + hole.height / 2;
    const r = Math.max(hole.width, hole.height) / 2 + PAD + 6 + circleBoost;
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Defs>
            <Mask id={maskId}>
              <Rect x={0} y={0} width={W} height={H} fill="#fff" />
              <Circle cx={cx} cy={cy} r={r} fill="#000" />
            </Mask>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={W}
            height={H}
            fill={DIM}
            mask={`url(#${maskId})`}
          />
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(94, 234, 212, 0.75)"
            strokeWidth={2.5}
          />
        </Svg>
      </View>
    );
  }

  const left = Math.max(0, hole.x - PAD);
  const top = Math.max(0, hole.y - PAD);
  const right = Math.min(W, hole.x + hole.width + PAD);
  const bottom = Math.min(H, hole.y + hole.height + PAD);
  const holeW = Math.max(0, right - left);
  const holeH = Math.max(0, bottom - top);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, top: 0, right: 0, height: top, backgroundColor: DIM }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, top: bottom, right: 0, bottom: 0, backgroundColor: DIM }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, top, width: left, height: holeH, backgroundColor: DIM }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: right, top, right: 0, height: holeH, backgroundColor: DIM }}
      />
    </View>
  );
}

function FlickerInfoIcon({ left, top }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.infoBadge,
        {
          left,
          top,
          opacity,
        },
      ]}
    >
      <Info color="#0f766e" size={20} strokeWidth={2.6} />
    </Animated.View>
  );
}

/**
 * Coach marks over PlayScreen. `focusRects` are overlay-local coordinates.
 */
export default function OnboardingOverlay({
  overlayRef = null,
  step = 0,
  topInset = 0,
  bottomInset = 0,
  focusRects = null,
  t,
  onNext,
  onSkip,
}) {
  const { width: windowW, height: windowH } = useWindowDimensions();
  const [overlaySize, setOverlaySize] = useState({ width: windowW, height: windowH });

  const safeStep = Math.max(0, Math.min(step, STEPS.length - 1));
  const current = STEPS[safeStep];
  const isLast = safeStep >= STEPS.length - 1;
  const hole = focusRects?.[current.focus] || null;

  const infoPos = useMemo(() => {
    if (!hole) return null;
    if (current.circular) {
      const cx = hole.x + hole.width / 2;
      const cy = hole.y + hole.height / 2;
      const r = Math.max(hole.width, hole.height) / 2 + PAD + 6 + (current.circleBoost || 0);
      return {
        left: Math.max(8, cx - r),
        top: Math.max(4, cy - r - INFO_SIZE / 2),
      };
    }
    if (current.fullWidth) {
      return {
        left: 12,
        top: Math.max(4, hole.y - PAD - INFO_SIZE / 2),
      };
    }
    return {
      left: Math.max(8, hole.x - PAD),
      top: Math.max(4, hole.y - PAD - INFO_SIZE / 2),
    };
  }, [hole, current.circular, current.fullWidth, current.circleBoost]);

  const tooltipStyle = useMemo(() => {
    if (current.focus === 'clue') {
      return { bottom: 132 + bottomInset };
    }
    if (current.focus === 'hint') {
      // Step 3: keep tip above the hint spotlight.
      const bottom = hole
        ? Math.max(168 + bottomInset, (overlaySize.height || windowH) - hole.y + 72)
        : 180 + bottomInset;
      return {
        bottom,
        alignItems: 'flex-start',
        paddingLeft: 20,
      };
    }
    if (current.focus === 'letter') {
      // Sit fully below the L circle so the tip never covers the spotlight.
      if (hole) {
        const r =
          Math.max(hole.width, hole.height) / 2 + PAD + 6 + (current.circleBoost || 0);
        const circleBottom = hole.y + hole.height / 2 + r;
        return { top: circleBottom + 18 };
      }
      return { top: '62%' };
    }
    // Wheel (step 2): sit clearly above the circular spotlight + info icon.
    const bottom = hole
      ? Math.max(160 + bottomInset, (overlaySize.height || windowH) - hole.y + 88)
      : 200 + bottomInset;
    return { bottom };
  }, [current.focus, current.circleBoost, hole, bottomInset, windowH, overlaySize.height]);

  return (
    <View
      ref={overlayRef}
      collapsable={false}
      style={styles.fill}
      pointerEvents="box-none"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) setOverlaySize({ width, height });
      }}
    >
      <SpotlightMask
        hole={hole}
        width={overlaySize.width || windowW}
        height={overlaySize.height || windowH}
        fullWidth={Boolean(current.fullWidth)}
        circular={Boolean(current.circular)}
        circleBoost={current.circleBoost || 0}
        maskId={`onboardingHole-${current.key}`}
      />

      {infoPos ? <FlickerInfoIcon left={infoPos.left} top={infoPos.top} /> : null}

      <Pressable
        style={[styles.skipBtn, { top: Math.max(topInset, 12) + 6 }]}
        onPress={onSkip}
        accessibilityRole="button"
        accessibilityLabel={t('onboarding.skip')}
      >
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </Pressable>

      <View pointerEvents="box-none" style={[styles.tooltipWrap, tooltipStyle]}>
        {current.key === 'letter' ? (
          <View style={styles.finishWrap}>
            <Text style={styles.finishTitle}>{t('onboarding.step.letter')}</Text>
            <Pressable
              style={styles.finishCircle}
              onPress={onNext}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.finish')}
            >
              <Text style={styles.finishCircleText}>{t('onboarding.finish')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.tooltip}>
            <Text style={styles.stepLabel}>
              {t('onboarding.stepLabel', { n: safeStep + 1 })}
            </Text>
            <Text style={styles.tooltipText}>{t(current.textKey)}</Text>
            <Pressable
              style={styles.nextBtn}
              onPress={onNext}
              accessibilityRole="button"
              accessibilityLabel={t(isLast ? 'onboarding.done' : 'onboarding.next')}
            >
              <Text style={styles.nextBtnText}>
                {t(isLast ? 'onboarding.done' : 'onboarding.next')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    elevation: 40,
  },
  dimFull: {
    ...StyleSheet.absoluteFillObject,
  },
  infoBadge: {
    position: 'absolute',
    zIndex: 3,
    width: INFO_SIZE,
    height: INFO_SIZE,
    borderRadius: INFO_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5eead4',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#2dd4bf',
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  skipBtn: {
    position: 'absolute',
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
  tooltipWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 18,
    zIndex: 2,
  },
  tooltip: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(94, 234, 212, 0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  stepLabel: {
    alignSelf: 'center',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(45, 212, 191, 0.22)',
    color: '#5eead4',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tooltipText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
  },
  nextBtn: {
    marginTop: 18,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14b8a6',
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  finishWrap: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  finishTitle: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  finishCircle: {
    width: 156,
    height: 156,
    borderRadius: 78,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14b8a6',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.88)',
    shadowColor: '#2dd4bf',
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  finishCircleText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
