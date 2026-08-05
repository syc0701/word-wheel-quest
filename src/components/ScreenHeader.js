import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAppearance } from '../context/AppearanceContext';

/** Shared top bar with back button — `onBack` defaults to no-op if omitted. */
export default function ScreenHeader({ title, onBack }) {
  const { colors, isRandomScene } = useAppearance();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
      <Pressable
        style={[
          styles.backBtn,
          {
            backgroundColor: isRandomScene ? 'rgba(255,255,255,0.94)' : colors.surface,
          },
        ]}
        onPress={onBack}
      >
        <ArrowLeft color={colors.text} size={22} />
      </Pressable>
      <Text
        style={[
          styles.title,
          { color: isRandomScene ? '#ffffff' : colors.text },
          isRandomScene && styles.titleOnScene,
        ]}
      >
        {title}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  titleOnScene: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  spacer: {
    width: 38,
  },
});
