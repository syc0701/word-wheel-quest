import { useEffect } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { WW } from '../constants/theme';

const SELECTED_SCALE = 1.18;
const SPRING = { damping: 11, stiffness: 220, mass: 0.65 };

export default function WheelLetter({ letter, x, y, radius, selected }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? SELECTED_SCALE : 1, SPRING);
  }, [selected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
        },
        selected && styles.nodeSelected,
        animatedStyle,
      ]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{letter}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  node: {
    position: 'absolute',
    backgroundColor: WW.surface,
    borderWidth: 1,
    borderColor: WW.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeSelected: {
    borderWidth: 2.5,
    borderColor: WW.wheelLine,
    backgroundColor: WW.surface,
    ...Platform.select({
      ios: {
        shadowColor: WW.wheelLineDark,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: WW.textOnSurface,
  },
  textSelected: {
    color: WW.wheelLineDark,
    fontWeight: '800',
  },
});
