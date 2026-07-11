import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { INTERMISSION } from './intermissionTheme';

function RotatingSpecularCrown() {
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(1, { duration: 3600, easing: Easing.linear }),
      -1,
      false
    );
  }, [spin]);

  const glintStyle = useAnimatedStyle(() => {
    const angle = spin.value * Math.PI * 2;
    return {
      transform: [
        { translateX: Math.cos(angle) * 18 },
        { translateY: Math.sin(angle) * 10 },
      ],
      opacity: 0.35 + Math.abs(Math.sin(angle)) * 0.55,
    };
  });

  return (
    <View style={styles.badgeWrap}>
      <LinearGradient
        colors={INTERMISSION.bronze}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.metalBadge}
      >
        <Crown size={34} color="#fff3c4" fill="#e8c547" strokeWidth={1.4} />
        <Animated.View style={[styles.specular, glintStyle]} />
      </LinearGradient>
    </View>
  );
}

export default function BrainPowerCard({ title, levelArrow, capacityLabel }) {
  return (
    <View style={styles.body}>
      <RotatingSpecularCrown />
      <Animated.Text entering={FadeInUp.duration(650).delay(140)} style={styles.title}>
        {title}
      </Animated.Text>
      <Animated.Text entering={FadeInUp.duration(650).delay(240)} style={styles.levelArrow}>
        {levelArrow}
      </Animated.Text>
      {capacityLabel ? (
        <Animated.Text entering={FadeInUp.duration(650).delay(320)} style={styles.capacityLabel}>
          {capacityLabel}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    width: '100%',
  },
  badgeWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metalBadge: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 220, 150, 0.75)',
    overflow: 'hidden',
    shadowColor: '#8b6914',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 9,
  },
  specular: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  title: {
    fontFamily: INTERMISSION.serif,
    fontSize: 24,
    fontWeight: '700',
    color: '#8b5a2b',
    textAlign: 'center',
    marginBottom: 8,
  },
  levelArrow: {
    fontFamily: INTERMISSION.serif,
    fontSize: 17,
    fontWeight: '600',
    color: INTERMISSION.titleTeal,
    textAlign: 'center',
    marginBottom: 10,
  },
  capacityLabel: {
    fontFamily: INTERMISSION.serif,
    fontSize: 13,
    fontWeight: '600',
    color: '#8b6914',
    textAlign: 'center',
    marginBottom: 4,
  },
});
