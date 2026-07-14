import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { APPEARANCE_LIGHT, APPEARANCE_RANDOM } from '../lib/appearance';
import { useAppearance } from '../context/AppearanceContext';
import HomeSmogEffect from './HomeSmogEffect';
import PlayAmbientBubbles from './PlayAmbientBubbles';

const DEEP_WATER = ['#7dd3fc', '#38bdf8', '#0284c7', '#0c4a6e', '#082f49', '#020617'];

/**
 * Screen shell over the shared AppBackground.
 * Layer order: backdrop (gradient / image) → mist → UI.
 */
export default function GradientBackground({ children, variant = 'home' }) {
  const { mode, ww } = useAppearance();
  const isPlay = variant === 'play';
  const showUnderwater = isPlay && mode !== APPEARANCE_RANDOM;
  // Mist sits between backdrop and chrome on light, and over random scene images.
  const showMist = mode === APPEARANCE_LIGHT || mode === APPEARANCE_RANDOM;
  const gradientColors = ww?.playGradient?.length >= 2 ? ww.playGradient : DEEP_WATER;

  return (
    <View style={styles.fill}>
      {showUnderwater ? (
        <View style={styles.backdrop} pointerEvents="none">
          <LinearGradient
            colors={gradientColors}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(224, 242, 254, 0.28)', 'rgba(56, 189, 248, 0.08)', 'transparent']}
            locations={[0, 0.35, 1]}
            style={styles.surfaceLight}
          />
          <PlayAmbientBubbles />
        </View>
      ) : null}

      {showMist ? (
        <View style={styles.mist} pointerEvents="none">
          <HomeSmogEffect />
        </View>
      ) : null}

      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  mist: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    overflow: 'hidden',
  },
  surfaceLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
});
