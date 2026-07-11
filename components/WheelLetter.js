import { useEffect } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAppearance } from '../context/AppearanceContext';

const SELECTED_SCALE = 1.18;
const SPRING = { damping: 11, stiffness: 220, mass: 0.65 };

export default function WheelLetter({ letter, x, y, radius, selected }) {
  const { ww } = useAppearance();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? SELECTED_SCALE : 1, SPRING);
  }, [selected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
