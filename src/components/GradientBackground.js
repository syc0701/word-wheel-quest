import { StyleSheet, View } from 'react-native';
import PlayAmbientBubbles from './PlayAmbientBubbles';

/**
 * Screen shell over the shared reef AppBackground.
 * Play variant adds ambient bubbles only (no second background image).
 */
export default function GradientBackground({ children, variant = 'home' }) {
  return (
    <View style={styles.fill}>
      {variant === 'play' ? (
        <View style={styles.backdrop} pointerEvents="none">
          <PlayAmbientBubbles />
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
