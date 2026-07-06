import { StyleSheet, Text, View, Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

/** Shared top bar with back button — `onBack` defaults to no-op if omitted. */
export default function ScreenHeader({ title, onBack }) {
  return (
    <View style={styles.topBar}>
      <Pressable style={styles.backBtn} onPress={onBack}>
        <ArrowLeft color={COLORS.text} size={22} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  spacer: {
    width: 38,
  },
});
