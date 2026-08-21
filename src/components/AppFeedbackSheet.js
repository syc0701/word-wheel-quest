import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_OPINION_MAX_LENGTH,
  collectFeedbackDeviceInfo,
  submitAppFeedback,
} from '../lib/feedbackApi';

export default function AppFeedbackSheet({ visible, onClose }) {
  const { colors } = useAppearance();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState(FEEDBACK_CATEGORIES[0].value);
  const [opinion, setOpinion] = useState('');
  const [deviceInfo, setDeviceInfo] = useState(() => collectFeedbackDeviceInfo());
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setError('');
    setSent(false);
    setDeviceInfo(collectFeedbackDeviceInfo());
  }, [visible]);

  const categoryLabel = useMemo(() => {
    const found = FEEDBACK_CATEGORIES.find((c) => c.value === category);
    return found ? t(found.labelKey) : category;
  }, [category, t]);

  const handleClose = () => {
    if (sending) return;
    setOpinion('');
    setCategory(FEEDBACK_CATEGORIES[0].value);
    setError('');
    setSent(false);
    onClose?.();
  };

  const handleSend = async () => {
    const text = opinion.trim();
    if (!text) {
      setError(t('settings.feedback.opinionRequired'));
      return;
    }
    setSending(true);
    setError('');
    try {
      await submitAppFeedback({
        categoryLabel,
        opinion: text,
        deviceInfo,
      });
      setOpinion('');
      setCategory(FEEDBACK_CATEGORIES[0].value);
      setSent(true);
    } catch (e) {
      setError(e?.message || t('settings.feedback.sendError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={[styles.handle, { backgroundColor: colors.surfaceLight }]} />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scroll}
            >
              {sent ? (
                <View style={styles.thanksBlock}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {t('settings.feedback.thanksTitle')}
                  </Text>
                  <Text style={[styles.intro, { color: colors.textMuted }]}>
                    {t('settings.feedback.thanksMessage')}
                  </Text>
                  <Pressable
                    style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                    onPress={handleClose}
                  >
                    <Text style={styles.primaryBtnText}>{t('settings.feedback.close')}</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {t('settings.feedback.title')}
                  </Text>
                  <Text style={[styles.intro, { color: colors.textMuted }]}>
                    {t('settings.feedback.intro')}
                  </Text>

                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                    {t('settings.feedback.category')}
                  </Text>
                  <View style={styles.chipWrap}>
                    {FEEDBACK_CATEGORIES.map((opt) => {
                      const selected = opt.value === category;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => setCategory(opt.value)}
                          disabled={sending}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: selected ? colors.primary : colors.surfaceLight,
                              borderColor: selected ? colors.primary : colors.surfaceLight,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: selected ? '#fff' : colors.text },
                            ]}
                          >
                            {t(opt.labelKey)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                    {t('settings.feedback.opinion')}
                  </Text>
                  <TextInput
                    value={opinion}
                    onChangeText={(value) =>
                      setOpinion(String(value || '').slice(0, FEEDBACK_OPINION_MAX_LENGTH))
                    }
                    editable={!sending}
                    multiline
                    maxLength={FEEDBACK_OPINION_MAX_LENGTH}
                    placeholder={t('settings.feedback.opinionPlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.surfaceLight,
                      },
                    ]}
                    textAlignVertical="top"
                  />
                  <Text style={[styles.counter, { color: colors.textMuted }]}>
                    {opinion.length}/{FEEDBACK_OPINION_MAX_LENGTH}
                  </Text>
                  <Text style={[styles.privacy, { color: colors.textMuted }]}>
                    {t('settings.feedback.privacyNote')}
                  </Text>

                  {error ? <Text style={styles.error}>{error}</Text> : null}

                  <View style={styles.actions}>
                    <Pressable
                      style={[styles.secondaryBtn, { backgroundColor: colors.surfaceLight }]}
                      onPress={handleClose}
                      disabled={sending}
                    >
                      <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                        {t('settings.feedback.cancel')}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.primaryBtn,
                        styles.sendBtn,
                        { backgroundColor: colors.primary, opacity: sending ? 0.7 : 1 },
                      ]}
                      onPress={() => void handleSend()}
                      disabled={sending}
                    >
                      {sending ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Send color="#fff" size={16} strokeWidth={2.2} />
                      )}
                      <Text style={styles.primaryBtnText}>{t('settings.feedback.send')}</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(4, 24, 28, 0.62)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  scroll: {
    paddingBottom: 8,
  },
  thanksBlock: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  counter: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
  },
  privacy: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  error: {
    marginTop: 12,
    fontSize: 13,
    color: '#f87171',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryBtn: {
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
