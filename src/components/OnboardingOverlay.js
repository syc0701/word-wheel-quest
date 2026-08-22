import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';
import { Info } from 'lucide-react-native';

const STEPS = [
  { key: 'clue', textKey: 'onboarding.step.clue', focus: 'clue', fullWidth: true },
  { key: 'wheel', textKey: 'onboarding.step.wheel', focus: 'wheel', circular: true, circleBoost: 6 },
  { key: 'hint', textKey: 'onboarding.step.hint', focus: 'hint', circular: true, circleBoost: 22 },
  {
    key: 'letter',
    textKey: 'onboarding.step.letter',
    focus: 'letter',
    circular: true,
    circleBoost: 28,
    delayedFinish: true,
    finishDelayMs: 3000,
  },
];

const PAD = 10;
const DIM = 'rgba(0, 0, 0, 0.62)';
const INFO_SIZE = 34;
const FINISH_CIRCLE = 280;

function getCircleLayout(hole, circleBoost = 0) {
  if (!hole || hole.width <= 0 || hole.height <= 0) return null;
  const cx = hole.x + hole.width / 2;
  const cy = hole.y + hole.height / 2;
  const r = Math.max(hole.width, hole.height) / 2 + PAD + 6 + circleBoost;
  return { cx, cy, r, diameter: r * 2, left: cx - r, top: cy - r };
}

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
    const layout = getCircleLayout(hole, circleBoost);
    if (!layout) {
      return <View pointerEvents="none" style={[styles.dimFull, { backgroundColor: DIM }]} />;
    }
    const { cx, cy, r } = layout;
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
  const finishOpacity = useRef(new Animated.Value(0)).current;
  const finishScale = useRef(new Animated.Value(0.72)).current;

  const safeStep = Math.max(0, Math.min(step, STEPS.length - 1));
  const current = STEPS[safeStep];
  const isLast = safeStep >= STEPS.length - 1;
  const isLetterStep = current.key === 'letter';
  const [showLetterFinish, setShowLetterFinish] = useState(false);

  useEffect(() => {
    if (!isLetterStep) {
      setShowLetterFinish(false);
      return undefined;
    }
    setShowLetterFinish(false);
    const delayMs = current.finishDelayMs || 3000;
    const timer = setTimeout(() => setShowLetterFinish(true), delayMs);
    return () => clearTimeout(timer);
  }, [isLetterStep, step, current.finishDelayMs]);

  useEffect(() => {
    if (!showLetterFinish) {
      finishOpacity.setValue(0);
      finishScale.setValue(0.72);
      return;
    }
    Animated.parallel([
      Animated.timing(finishOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(finishScale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showLetterFinish, finishOpacity, finishScale]);

  const showLetterSpotlight = isLetterStep && !showLetterFinish;
  const showCenteredFinish = isLetterStep && showLetterFinish;
  const hole = showCenteredFinish ? null : focusRects?.[current.focus] || null;
  const circleLayout = useMemo(
    () => (current.circular && hole ? getCircleLayout(hole, current.circleBoost || 0) : null),
    [current.circular, current.circleBoost, hole]
  );

  const finishTitle = useMemo(() => {
    const raw = t(current.textKey);
    const firstLine = String(raw).split('\n')[0]?.trim();
    return firstLine || raw;
  }, [current.textKey, t]);

  const infoPos = useMemo(() => {
    if (showCenteredFinish || !hole) return null;
    if (current.circular && circleLayout) {
      const { cx, cy, r } = circleLayout;
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
  }, [hole, current.circular, current.fullWidth, circleLayout, showCenteredFinish]);

  const tooltipStyle = useMemo(() => {
    if (showLetterSpotlight || showCenteredFinish) return null;
    if (current.focus === 'clue') {
      const bottom = hole
        ? Math.max(120 + bottomInset, (overlaySize.height || windowH) - hole.y + 28)
        : 200 + bottomInset;
      return { bottom };
    }
    if (current.focus === 'hint') {
      const bottom = hole
        ? Math.max(168 + bottomInset, (overlaySize.height || windowH) - hole.y + 72)
        : 180 + bottomInset;
      return {
        bottom,
        alignItems: 'flex-start',
        paddingLeft: 20,
      };
    }
    const bottom = hole
      ? Math.max(160 + bottomInset, (overlaySize.height || windowH) - hole.y + 88)
      : 200 + bottomInset;
    return { bottom };
  }, [current.focus, showCenteredFinish, showLetterSpotlight, hole, bottomInset, windowH, overlaySize.height]);

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
      {!showCenteredFinish ? (
        <SpotlightMask
          hole={hole}
          width={overlaySize.width || windowW}
          height={overlaySize.height || windowH}
          fullWidth={Boolean(current.fullWidth)}
          circular={Boolean(current.circular)}
          circleBoost={current.circleBoost || 0}
          maskId={`onboardingHole-${current.key}`}
        />
      ) : null}

      {showCenteredFinish ? (
        <>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: finishOpacity }]}>
            <LinearGradient
              colors={['rgba(2, 18, 28, 0.78)', 'rgba(6, 40, 48, 0.9)', 'rgba(2, 12, 20, 0.95)']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.finishScreenWrap,
              { opacity: finishOpacity, transform: [{ scale: finishScale }] },
            ]}
          >
            <View style={styles.finishCircle}>
              <Text style={styles.finishCircleTitle}>{finishTitle}</Text>
              <Pressable
                style={styles.finishCircleBtn}
                onPress={onNext}
                accessibilityRole="button"
                accessibilityLabel={t('onboarding.finish')}
              >
                <Text style={styles.finishCircleBtnText}>{t('onboarding.finish')}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </>
      ) : null}

      {!showCenteredFinish && infoPos ? (
        <FlickerInfoIcon left={infoPos.left} top={infoPos.top} />
      ) : null}

      {!showCenteredFinish ? (
        <Pressable
          style={[styles.skipBtn, { top: Math.max(topInset, 12) + 6 }]}
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.skip')}
        >
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </Pressable>
      ) : null}

      {tooltipStyle ? (
        <View pointerEvents="box-none" style={[styles.tooltipWrap, tooltipStyle]}>
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
        </View>
      ) : null}
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
  finishScreenWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    zIndex: 5,
  },
  finishCircle: {
    width: FINISH_CIRCLE,
    height: FINISH_CIRCLE,
    borderRadius: FINISH_CIRCLE / 2,
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
  finishCircleTitle: {
    color: '#ffffff',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(45, 212, 191, 0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  finishCircleBtn: {
    marginTop: 18,
    minWidth: 140,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14b8a6',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.88)',
  },
  finishCircleBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.2,
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
});
