import { StyleSheet, View } from 'react-native';
import { APPEARANCE_LIGHT } from '../lib/appearance';
import { useAppearance } from '../context/AppearanceContext';
import HomeSmogEffect from './HomeSmogEffect';
import PlayAmbientBubbles from './PlayAmbientBubbles';

/**
 * Screen shell over the shared AppBackground.
 * Light theme: drifting mist on home + play.
 * Dark play: ambient bubbles.
 */
export default function GradientBackground({ children, variant = 'home' }) {
  const { mode, isDark } = useAppearance();
  const showMist = mode === APPEARANCE_LIGHT && (variant === 'home' || variant === 'play');
  const showBubbles = variant === 'play' && isDark;

  return (
    <View style={styles.fill}>
      {showMist || showBubbles ? (
        <View style={styles.backdrop} pointerEvents="none">
          {showMist ? <HomeSmogEffect /> : null}
          {showBubbles ? <PlayAmbientBubbles /> : null}
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
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
});
