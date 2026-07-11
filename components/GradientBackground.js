import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useAppearance } from '../context/AppearanceContext';
import HomeSmogEffect from './HomeSmogEffect';
import PlayAmbientBubbles from './PlayAmbientBubbles';

export default function GradientBackground({ children, variant = 'home' }) {
  const { ww } = useAppearance();
  const colors = variant === 'play' ? ww.playGradient : ww.gradient;
  return (
    <LinearGradient colors={colors} style={styles.fill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
      {/* Backdrop only — always under UI */}
      <View style={styles.backdrop} pointerEvents="none">
        <HomeSmogEffect />
        {variant === 'play' ? <PlayAmbientBubbles /> : null}
      </View>
      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    elevation: 0,
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
    elevation: 10,
  },
});
