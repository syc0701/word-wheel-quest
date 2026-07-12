import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  APPEARANCE_DARK,
  APPEARANCE_LIGHT,
  APPEARANCE_RANDOM,
  useAppearance,
} from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';

const OPTIONS = [
  { value: APPEARANCE_LIGHT, labelKey: 'settings.appearance.light' },
  { value: APPEARANCE_DARK, labelKey: 'settings.appearance.dark' },
  { value: APPEARANCE_RANDOM, labelKey: 'settings.appearance.random' },
];

/** iOS-style Light / Dark / Random segmented control for Settings. */
export default function AppearancePicker() {
  const { mode, setMode, colors } = useAppearance();
  const t = useT();

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: colors.segmentTrackBg,
          borderColor: colors.segmentTrackBorder,
        },
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={t('settings.appearance.a11y')}
    >
      {OPTIONS.map((opt) => {
        const selected = mode === opt.value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) setMode(opt.value);
            }}
            style={[
              styles.segment,
              selected && {
                backgroundColor: colors.segmentSelectedBg,
                shadowColor: '#000',
                shadowOpacity: 0.18,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1 },
                elevation: 2,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: selected ? colors.segmentSelectedText : colors.segmentInactiveText,
                  fontWeight: selected ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {t(opt.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 13,
  },
});
