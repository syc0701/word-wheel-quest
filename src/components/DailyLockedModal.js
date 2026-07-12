import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, Lock, Map } from 'lucide-react-native';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import { WORD_WHEEL_DAILY_UNLOCK_LEVEL } from '../constants/api';

/**
 * Branded daily-lock popup (replaces system Alert).
 */
export default function DailyLockedModal({ visible, onClose, unlockLevel = WORD_WHEEL_DAILY_UNLOCK_LEVEL }) {
  const { colors } = useAppearance();
  const t = useT();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button">
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primary,
            },
          ]}
          onPress={(e) => e.stopPropagation?.()}
        >
          <View style={[styles.iconRing, { backgroundColor: colors.surfaceLight, borderColor: colors.primary }]}>
            <Lock color={colors.primaryGlow} size={28} strokeWidth={2} />
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Calendar color="#fff" size={12} strokeWidth={2.4} />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {t('home.dailyPuzzle.lockedTitle')}
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            {t('home.dailyPuzzle.lockedBody', { n: unlockLevel })}
          </Text>

          <View style={[styles.levelChip, { backgroundColor: colors.surfaceLight, borderColor: colors.primary }]}>
            <Map color={colors.primaryGlow} size={16} strokeWidth={2} />
            <Text style={[styles.levelChipText, { color: colors.primaryGlow }]}>
              {t('common.level', { n: unlockLevel })}
            </Text>
          </View>

          <Pressable
            style={[styles.cta, { backgroundColor: colors.primary }]}
            onPress={onClose}
            accessibilityLabel={t('home.dailyPuzzle.lockedOk')}
          >
            <Text style={styles.ctaText}>{t('home.dailyPuzzle.lockedOk')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 24, 28, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 1.5,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  body: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  levelChip: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  levelChipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  cta: {
    marginTop: 20,
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
