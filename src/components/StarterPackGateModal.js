import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gift, Lock } from 'lucide-react-native';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import { FREE_DAILY_PLAYS, GUEST_STARTER_UNLOCK_LEVEL, STARTER_PACK_PUZZLE_CREDITS } from '../constants/guestAccess';

/**
 * Starter pack / credits gate for journey 51+ and daily after free quota.
 */
export default function StarterPackGateModal({ visible, onClose, onShop, context = 'level' }) {
  const { colors } = useAppearance();
  const t = useT();
  const titleKey =
    context === 'credits'
      ? 'guest.starter.creditsTitle'
      : context === 'daily'
        ? 'guest.starter.dailyTitle'
        : 'guest.starter.levelTitle';
  const bodyKey =
    context === 'credits'
      ? 'guest.starter.creditsBody'
      : context === 'daily'
        ? 'guest.starter.dailyBody'
        : 'guest.starter.levelBody';
  const bodyParams =
    context === 'daily'
      ? { n: FREE_DAILY_PLAYS }
      : context === 'credits'
        ? { n: STARTER_PACK_PUZZLE_CREDITS }
        : { n: GUEST_STARTER_UNLOCK_LEVEL };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button">
        <Pressable
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.primary },
          ]}
          onPress={(e) => e.stopPropagation?.()}
        >
          <View style={[styles.iconRing, { backgroundColor: colors.surfaceLight, borderColor: colors.primary }]}>
            <Lock color={colors.primaryGlow} size={26} strokeWidth={2} />
            <View style={[styles.badge, { backgroundColor: '#f59e0b' }]}>
              <Gift color="#fff" size={12} strokeWidth={2.4} />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{t(titleKey)}</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            {t(bodyKey, bodyParams)}
          </Text>

          <Pressable
            style={[styles.cta, { backgroundColor: colors.primary }]}
            onPress={onShop}
            accessibilityLabel={t('guest.starter.shopCta')}
          >
            <Text style={styles.ctaText}>{t('guest.starter.shopCta')}</Text>
          </Pressable>

          <Pressable style={styles.secondary} onPress={onClose} hitSlop={8}>
            <Text style={[styles.secondaryText, { color: colors.textMuted }]}>
              {t('guest.starter.notNow')}
            </Text>
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
    paddingBottom: 16,
    alignItems: 'center',
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
  },
  body: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
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
  secondary: {
    marginTop: 12,
    paddingVertical: 8,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
