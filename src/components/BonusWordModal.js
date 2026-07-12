import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gift, Sparkles } from 'lucide-react-native';
import { GiTwoCoins } from './GiTwoCoins';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import { WORD_WHEEL_BONUS_WORD_GIFT } from '../lib/points';

/**
 * Popup when the player spells a real dictionary word that is not on the puzzle.
 * First find in a puzzle awards coins; later finds still celebrate without a gift.
 */
export default function BonusWordModal({
  visible,
  onClose,
  word = '',
  awardedGift = false,
  giftCoins = WORD_WHEEL_BONUS_WORD_GIFT,
}) {
  const { colors } = useAppearance();
  const t = useT();
  const label = String(word || '').trim().toUpperCase();

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
            {awardedGift ? (
              <Gift color={colors.primaryGlow} size={28} strokeWidth={2} />
            ) : (
              <Sparkles color={colors.primaryGlow} size={28} strokeWidth={2} />
            )}
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {t('bonusWord.title')}
          </Text>
          {label ? (
            <Text style={[styles.word, { color: colors.primaryGlow }]}>{label}</Text>
          ) : null}
          <Text style={[styles.body, { color: colors.textMuted }]}>
            {awardedGift
              ? t('bonusWord.bodyGift', { n: giftCoins })
              : t('bonusWord.bodyNoGift')}
          </Text>

          {awardedGift ? (
            <View style={[styles.giftChip, { backgroundColor: 'rgba(250, 204, 21, 0.16)', borderColor: '#eab308' }]}>
              <GiTwoCoins size={22} color="#facc15" />
              <Text style={styles.giftChipText}>{t('bonusWord.giftAmount', { n: giftCoins })}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.cta, { backgroundColor: colors.primary }]}
            onPress={onClose}
            accessibilityLabel={t('bonusWord.ok')}
          >
            <Text style={styles.ctaText}>{t('bonusWord.ok')}</Text>
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  word: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  body: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  giftChip: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  giftChipText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ca8a04',
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
