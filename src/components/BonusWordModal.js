import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GiTwoCoins } from './GiTwoCoins';
import { PiTreasureChest } from './PiTreasureChest';
import { FirecrackerFlare } from '../effect';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import { WORD_WHEEL_BONUS_WORD_GIFT } from '../lib/points';

const LETTER_STAGGER_MS = 140;
const LETTER_ENTER_MS = 280;

function BreathingTreasure({ color }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.14, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.94, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <View style={[styles.iconRing, { backgroundColor: 'rgba(250, 204, 21, 0.14)', borderColor: '#eab308' }]}>
        <PiTreasureChest size={34} color={color} />
      </View>
    </Animated.View>
  );
}

function LetterReveal({ word, color }) {
  const letters = useMemo(() => Array.from(String(word || '')), [word]);

  return (
    <View style={styles.letterRow}>
      {letters.map((ch, index) => (
        <Animated.Text
          key={`${ch}-${index}`}
          entering={ZoomIn.delay(220 + index * LETTER_STAGGER_MS)
            .duration(LETTER_ENTER_MS)
            .springify()
            .damping(12)}
          style={[styles.letter, { color }]}
        >
          {ch}
        </Animated.Text>
      ))}
    </View>
  );
}

function PulsingCoinGift({ label, visible, burstId }) {
  const scale = useSharedValue(0.4);

  useEffect(() => {
    if (!visible) {
      scale.value = 0.4;
      return;
    }
    scale.value = 0.4;
    scale.value = withSequence(
      withSpring(1.28, { damping: 8, stiffness: 180 }),
      withTiming(0.92, { duration: 160, easing: Easing.out(Easing.quad) }),
      withSpring(1.18, { damping: 10, stiffness: 200 }),
      withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }),
      withDelay(
        120,
        withSequence(
          withTiming(1.12, { duration: 280, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 280, easing: Easing.inOut(Easing.sin) })
        )
      )
    );
  }, [visible, burstId, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.giftWrap}>
      <FirecrackerFlare visible={visible} burstId={burstId} />
      <Animated.View
        style={[
          styles.giftChip,
          { backgroundColor: 'rgba(250, 204, 21, 0.2)', borderColor: '#eab308' },
          style,
        ]}
      >
        <GiTwoCoins size={28} color="#facc15" />
        <Text style={styles.giftChipText}>{label}</Text>
      </Animated.View>
    </View>
  );
}

/**
 * Popup when the player spells a real dictionary word that is not on the puzzle.
 * Awarded once per puzzle (+coins).
 */
export default function BonusWordModal({
  visible,
  onClose,
  word = '',
  awardedGift = true,
  giftCoins = WORD_WHEEL_BONUS_WORD_GIFT,
}) {
  const { colors } = useAppearance();
  const t = useT();
  const label = String(word || '').trim().toUpperCase();
  const letterCount = label.length;
  const coinRevealDelayMs = 320 + letterCount * LETTER_STAGGER_MS + LETTER_ENTER_MS;

  const [coinReady, setCoinReady] = useState(false);
  const [flareId, setFlareId] = useState(0);
  const [openId, setOpenId] = useState(0);

  useEffect(() => {
    if (!visible) {
      setCoinReady(false);
      return undefined;
    }
    setOpenId((n) => n + 1);
    setCoinReady(false);
    if (!awardedGift) return undefined;
    const timer = setTimeout(() => {
      setCoinReady(true);
      setFlareId((n) => n + 1);
    }, coinRevealDelayMs);
    return () => clearTimeout(timer);
  }, [visible, awardedGift, coinRevealDelayMs, label]);

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
          {visible ? (
            <View key={`bonus-${label}-${openId}`} style={styles.cardInner}>
              <BreathingTreasure color="#ca8a04" />

              <Animated.Text
                entering={FadeInUp.duration(420).delay(80)}
                style={[styles.title, { color: colors.text }]}
              >
                {t('bonusWord.title')}
              </Animated.Text>

              {label ? (
                <LetterReveal word={label} color={colors.primaryGlow} />
              ) : null}

              <Animated.Text
                entering={FadeIn.duration(420).delay(260)}
                style={[styles.body, { color: colors.textMuted }]}
              >
                {t('bonusWord.bodyGift', { n: giftCoins })}
              </Animated.Text>

              {awardedGift ? (
                <PulsingCoinGift
                  label={t('bonusWord.giftAmount', { n: giftCoins })}
                  visible={coinReady}
                  burstId={flareId}
                />
              ) : null}
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
    overflow: 'visible',
  },
  cardInner: {
    width: '100%',
    alignItems: 'center',
  },
  iconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
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
  letterRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 36,
  },
  letter: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1,
  },
  body: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  giftWrap: {
    marginTop: 18,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    overflow: 'visible',
  },
  giftChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    zIndex: 2,
  },
  giftChipText: {
    fontSize: 18,
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
