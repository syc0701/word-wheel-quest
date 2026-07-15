import { Image, StyleSheet, View } from 'react-native';
import { useAppearance } from '../context/AppearanceContext';

/**
 * App backdrop: solid theme color, or rotating scene photo when Appearance = Image.
 */
export default function AppBackground({ children, scrim, style }) {
  const { colors, isRandomScene, weeklyBg } = useAppearance();
  const showScene = isRandomScene && weeklyBg?.source;
  const resolvedScrim = scrim ?? (showScene ? 0.42 : 0.12);

  return (
    <View
      style={[
        styles.root,
        style,
        !showScene && { backgroundColor: colors.background },
      ]}
    >
      {showScene ? (
        <View style={styles.backdrop} pointerEvents="none">
          <Image source={weeklyBg.source} style={styles.image} resizeMode="cover" />
          {resolvedScrim > 0 ? (
            <View
              style={[styles.scrim, { backgroundColor: `rgba(6, 32, 38, ${resolvedScrim})` }]}
            />
          ) : null}
        </View>
      ) : null}
      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
