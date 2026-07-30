import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import { isLoggedIn } from '../lib/auth';
import PushNotificationService from '../services/PushNotificationService';

/**
 * Settings toggle for per-app push notifications.
 * Always visible when push is supported; guests are prompted to sign in
 * because preference + device-token APIs require a Cognito JWT.
 */
export default function NotificationsSettingsCard({
  authTick = 0,
  onRequireSignIn,
}) {
  const { colors } = useAppearance();
  const t = useT();
  const [authed, setAuthed] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const showPush = PushNotificationService.isPushSupported();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const loggedIn = await isLoggedIn();
      setAuthed(loggedIn);
      if (!loggedIn) {
        setEnabled(false);
        return;
      }
      try {
        setEnabled(await PushNotificationService.getAppNotificationPreference());
      } catch {
        setEnabled(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, authTick]);

  const promptSignIn = () => {
    Alert.alert(
      t('settings.notifications.signInTitle'),
      t('settings.notifications.signInBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.account.signIn'),
          onPress: () => onRequireSignIn?.(),
        },
      ]
    );
  };

  const onToggle = async (next) => {
    if (saving || loading) return;

    if (!authed) {
      promptSignIn();
      return;
    }

    const previous = enabled;
    setEnabled(next);
    setSaving(true);
    try {
      await PushNotificationService.setAppNotificationPreference(next);
      if (next) {
        const result = await PushNotificationService.enablePushNotifications();
        if (!result.ok) {
          setEnabled(false);
          await PushNotificationService.setAppNotificationPreference(false);
          if (result.reason === 'denied') {
            Alert.alert(
              t('settings.notifications.deniedTitle'),
              t('settings.notifications.deniedBody')
            );
          }
        }
      } else {
        await PushNotificationService.disablePushNotifications();
      }
    } catch {
      setEnabled(previous);
      Alert.alert(
        t('settings.notifications.saveFailedTitle'),
        t('settings.notifications.saveFailedBody')
      );
    } finally {
      setSaving(false);
    }
  };

  if (!showPush) {
    return null;
  }

  return (
    <View style={styles.row}>
      <View style={styles.body}>
        <Text style={[styles.label, { color: colors.text }]}>
          {t('settings.notifications.label')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {authed
            ? t('settings.notifications.subtitle')
            : t('settings.notifications.signInSubtitle')}
        </Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        disabled={saving || loading}
        trackColor={{ false: colors.segmentTrackBorder, true: colors.primary }}
        thumbColor="#ffffff"
        ios_backgroundColor={colors.segmentTrackBorder}
        accessibilityLabel={t('settings.notifications.label')}
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
