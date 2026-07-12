import { useEffect } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAppearance } from '../context/AppearanceContext';

const SELECTED_SCALE = 1.18;
const SPRING = { damping: 11, stiffness: 220, mass: 0.65 };
/** Full turns while collapsing into / expanding from the center (cyclone path). */
const SPIRAL_TURNS = 1;

/**
 * Letter chip on the wheel.
 * `shuffleProgress` 0 = ring position, 1 = collapsed at wheel center (hidden).
 * Path is a spiral (radius shrinks while angle winds), not a straight line.
 */
export default function WheelLetter({
  letter,
  x,
  y,
  radius,
  selected,
  centerX,
  centerY,
  shuffleProgress,
}) {
  const { ww } = useAppearance();
  const selectScale = useSharedValue(1);
  const idleProgress = useSharedValue(0);
  const progress = shuffleProgress ?? idleProgress;

  useEffect(() => {
    selectScale.value = withSpring(selected ? SELECTED_SCALE : 1, SPRING);
  }, [selected, selectScale]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const dx = x - centerX;
    const dy = y - centerY;
    const baseRadius = Math.hypot(dx, dy);
    const baseAngle = Math.atan2(dy, dx);
    // Wind inward clockwise as p → 1; unwind the same spiral as p → 0.
    const angle = baseAngle + p * SPIRAL_TURNS * Math.PI * 2;
    const r = baseRadius * (1 - p);
    const currX = centerX + r * Math.cos(angle);
    const currY = centerY + r * Math.sin(angle);
    const ringScale = Math.max(0, 1 - p);

    return {
      opacity: ringScale,
      transform: [
        { translateX: currX - x },
        { translateY: currY - y },
        { rotate: `${p * SPIRAL_TURNS * 360}deg` },
        { scale: ringScale * selectScale.value },
      ],
    };
  }, [x, y, centerX, centerY]);

  const fillColors = selected
    ? ww.letterSelectedGradient
    : ww.letterBgGradient || [ww.letterBg, ww.letterBg];
  const borderColor = selected
    ? ww.letterSelectedBorder
    : ww.letterBorder || ww.border;
  const textColor = selected
    ? ww.letterSelectedText
    : ww.letterText || ww.textOnSurface;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.node,
        {
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          left: x - radius,
          top: y - radius,
          borderColor,
          borderWidth: selected ? 2.5 : 1.5,
          overflow: 'hidden',
          ...(selected
            ? Platform.select({
                ios: {
                  shadowColor: ww.wheelLineDark,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.65,
                  shadowRadius: 10,
                },
                android: { elevation: 8 },
                default: {},
              })
            : Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3,
                },
                android: { elevation: 3 },
                default: {},
              })),
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={fillColors}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[styles.text, { color: textColor }]}>{letter}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  node: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 22,
    fontWeight: '800',
  },
});
