import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '../context/AppearanceContext';
import { useLanguage } from '../context/LanguageContext';

/** Compact wrapping toggle chips for Settings language selection. */
export default function LanguagePicker() {
  const { colors } = useAppearance();
  const { locale, setLocale, locales, t } = useLanguage();

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
      accessibilityLabel={t('settings.language.a11y')}
    >
      {locales.map((item) => {
        const selected = locale === item.code;
        return (
          <Pressable
            key={item.code}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${item.nativeName}, ${item.englishName}`}
            onPress={() => {
              if (!selected) setLocale(item.code);
            }}
            style={[
              styles.chip,
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
              {item.nativeName}
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
    flexWrap: 'wrap',
    borderRadius: 10,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
  },
});
