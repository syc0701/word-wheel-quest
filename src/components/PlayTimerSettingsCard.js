import { StyleSheet, Switch, Text, View } from 'react-native';
import { useAppearance } from '../context/AppearanceContext';
import { usePlayTimer } from '../context/PlayTimerContext';
import { useT } from '../context/LanguageContext';

/** Settings toggle for the on-play / completion timer (no outer card). */
export default function PlayTimerSettingsCard() {
  const { colors } = useAppearance();
  const { timerEnabled, setTimerEnabled, ready } = usePlayTimer();
  const t = useT();

  return (
    <View style={styles.row}>
      <View style={styles.body}>
        <Text style={[styles.label, { color: colors.text }]}>
          {t('settings.timer.label')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {t('settings.timer.subtitle')}
        </Text>
      </View>
      <Switch
        value={timerEnabled === true}
        onValueChange={setTimerEnabled}
        disabled={!ready}
        trackColor={{ false: colors.segmentTrackBorder, true: colors.primary }}
        thumbColor="#ffffff"
        ios_backgroundColor={colors.segmentTrackBorder}
        accessibilityLabel={t('settings.timer.label')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
