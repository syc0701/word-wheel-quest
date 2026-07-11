import { StyleSheet, Switch, Text, View } from 'react-native';
import { useAppearance } from '../context/AppearanceContext';
import { useAudio } from '../context/AudioContext';

function ToggleRow({ label, subtitle, value, onValueChange, colors }) {
  return (
    <View style={styles.row}>
      <View style={styles.body}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.segmentTrackBorder, true: colors.primary }}
        thumbColor="#ffffff"
        ios_backgroundColor={colors.segmentTrackBorder}
        accessibilityLabel={label}
      />
    </View>
  );
}

/** Settings toggles for background music and sound effects. */
export default function AudioSettingsCard() {
  const { colors } = useAppearance();
  const { musicEnabled, sfxEnabled, setMusicEnabled, setSfxEnabled, playSfx } = useAudio();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
      ]}
    >
      <ToggleRow
        label="Play background music"
        subtitle="Loops on Home and Play"
        value={musicEnabled}
        onValueChange={setMusicEnabled}
        colors={colors}
      />
      <View style={[styles.divider, { backgroundColor: colors.surfaceLight }]} />
      <ToggleRow
        label="Play sound effects"
        subtitle="Clicks, correct, wrong, and win sounds"
        value={sfxEnabled}
        onValueChange={async (next) => {
          await setSfxEnabled(next);
          if (next) playSfx('chime');
        }}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 4,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
