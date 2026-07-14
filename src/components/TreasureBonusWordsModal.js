import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BookOpen, Gift, X } from 'lucide-react-native';
import { PiTreasureChest } from './PiTreasureChest';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import { WORD_WHEEL_BONUS_WORD_GIFT } from '../lib/points';

/**
 * Lists bonus (off-grid) words found this puzzle when the treasure chest is opened.
 * Each unique word earned a gift once.
 */
export default function TreasureBonusWordsModal({
  visible,
  onClose,
  onWordPress,
  words = [],
  giftCoins = WORD_WHEEL_BONUS_WORD_GIFT,
}) {
  const { colors } = useAppearance();
  const t = useT();
  const list = Array.isArray(words) ? words : [];

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
          <View style={styles.header}>
            <View style={[styles.iconRing, { backgroundColor: colors.surfaceLight, borderColor: colors.primary }]}>
              <PiTreasureChest size={26} color="#facc15" />
            </View>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: colors.surfaceLight }]}
              onPress={onClose}
              accessibilityLabel={t('treasureChest.close')}
              hitSlop={8}
            >
              <X color={colors.textMuted} size={18} strokeWidth={2.2} />
            </Pressable>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{t('treasureChest.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {t('treasureChest.subtitle', { n: giftCoins })}
          </Text>

          {list.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              {t('treasureChest.empty')}
            </Text>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {list.map((raw) => {
                const word = String(raw || '').trim().toUpperCase();
                if (!word) return null;
                return (
                  <Pressable
                    key={word}
                    onPress={() => onWordPress?.(word)}
                    style={[
                      styles.row,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: '#eab308',
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t('treasureChest.openDictionary', { word })}
                  >
                    <View style={styles.wordLeft}>
                      <BookOpen color={colors.primary || '#0d9488'} size={16} strokeWidth={2.2} />
                      <Text style={[styles.word, { color: colors.text }]}>{word}</Text>
                    </View>
                    <View style={styles.giftBadge}>
                      <Gift color="#ca8a04" size={14} strokeWidth={2.2} />
                      <Text style={styles.giftBadgeText}>
                        {t('treasureChest.giftBadge', { n: giftCoins })}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <Pressable
            style={[styles.cta, { backgroundColor: colors.primary }]}
            onPress={onClose}
            accessibilityLabel={t('treasureChest.close')}
          >
            <Text style={styles.ctaText}>{t('treasureChest.close')}</Text>
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
    maxHeight: '78%',
    borderRadius: 22,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    marginTop: 22,
    marginBottom: 8,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  list: {
    marginTop: 14,
    maxHeight: 280,
  },
  listContent: {
    gap: 8,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  wordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  word: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
  },
  giftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  giftBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ca8a04',
  },
  cta: {
    marginTop: 16,
    minHeight: 46,
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
