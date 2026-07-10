import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { WW } from '../constants/theme';
import HomeSmogEffect from './HomeSmogEffect';
import PlayAmbientBubbles from './PlayAmbientBubbles';

export default function GradientBackground({ children, variant = 'home' }) {
  const colors = variant === 'play' ? WW.playGradient : WW.gradient;
  return (
    <LinearGradient colors={colors} style={styles.fill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
      {variant === 'home' ? <HomeSmogEffect /> : null}
      {variant === 'play' ? <PlayAmbientBubbles /> : null}
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
