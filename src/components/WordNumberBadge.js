import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppearance } from '../context/AppearanceContext';
import { wordNumberBadgeTone } from '../lib/gridTheme';

/** Corner badge for a crossword word number. Odd and even numbers swap colors. */
export default function WordNumberBadge({ label, boxSize, fontSize, compact = false }) {
  const { isDark } = useAppearance();
  const tone = wordNumberBadgeTone(label, isDark);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.anchor,
        {
          width: boxSize,
          height: boxSize,
          top: -boxSize / 2,
          left: -boxSize / 2,
          borderColor: tone.border,
        },
      ]}
    >
      <LinearGradient
        colors={tone.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text
        style={[
          styles.text,
          {
            fontSize,
            lineHeight: fontSize + 1,
            color: tone.text,
          },
          compact && styles.textCompact,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    borderWidth: 1,
    overflow: 'hidden',
  },
  text: {
    fontWeight: '800',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  textCompact: {
    fontSize: 12,
    letterSpacing: -0.3,
  },
});
