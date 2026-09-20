import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gift } from 'lucide-react-native';
import { useT } from '../context/LanguageContext';

const BASE_COINS = 2;
const STREAK_COINS = 3;
const CONFETTI_COLORS = ['#f472b6', '#fb7185', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f97316', '#2dd4bf'];

const STAGE = 280;

function buildPieces(burstId) {
  const pieces = [];
  for (let i = 0; i < 28; i += 1) {
    const angle = (-120 + (i / 27) * 240) * (Math.PI / 180);
    const dist = 90 + ((burstId + i * 7) % 46);
    pieces.push({
      id: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * 36 + 48 + (i % 5) * 14,
      delay: (i % 8) * 28,
      color: CONFETTI_COLORS[(burstId + i) % CONFETTI_COLORS.length],
      width: i % 3 === 0 ? 9 : 13,
      height: i % 3 === 0 ? 9 : 6,
      spin: ((burstId + i * 17) % 160) - 80,
    });
  }
  return pieces;
}

function ConfettiPiece({ piece, play }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!play) {
      progress.setValue(0);
      return undefined;
    }
    progress.setValue(0);
    const fall = Animated.timing(progress, {
      toValue: 1,
      duration: 980,
      delay: piece.delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    fall.start();
    return () => fall.stop();
  }, [play, piece.delay, piece.id, progress]);

  const opacity = progress.interpolate({
    inputRange: [0, 0.12, 0.72, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
        style={[
          styles.confettiPiece,
          {
            left: STAGE / 2 - piece.width / 2,
            top: STAGE / 2 - 24 - piece.height / 2,
            width: piece.width,
          height: piece.height,
          borderRadius: piece.height > piece.width ? 4 : 2,
          backgroundColor: piece.color,
          opacity,
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.dx] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.dy] }) },
            { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.spin}deg`] }) },
          ],
        },
      ]}
    />
  );
}

function GiftConfetti({ play, burstId }) {
  const pieces = useMemo(() => (play ? buildPieces(burstId) : []), [play, burstId]);
  if (!pieces.length) return null;
  return (
    <View pointerEvents="none" style={styles.confettiLayer}>
      {pieces.map((piece) => (
        <ConfettiPiece key={`${burstId}-${piece.id}`} piece={piece} play={play} />
      ))}
    </View>
  );
}

export default function DailyGiftModal({
  visible,
  mode,
  coins,
  streak,
  streakDays,
  isStreak,
  claimed,
  busy,
  onClaim,
  onClose,
}) {
  const t = useT();
  const [burstId, setBurstId] = useState(0);
  const enter = useRef(new Animated.Value(0)).current;
  const days = Math.max(0, Math.floor(Number(streakDays ?? streak) || 0));
  const streakBonus = typeof isStreak === 'boolean' ? isStreak : days >= 2;
  const rewardCoins = coins > 0 ? coins : (streakBonus ? STREAK_COINS : BASE_COINS);

  useEffect(() => {
    if (!visible) {
      enter.setValue(0);
      return undefined;
    }
    enter.setValue(0);
    const bounce = Animated.spring(enter, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    });
    bounce.start();
    setBurstId((id) => id + 1);
    return () => bounce.stop();
  }, [visible, enter]);

  const iconScale = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.iconStage}>
          <GiftConfetti play={visible} burstId={burstId} />
          <Animated.View style={[styles.giftBadge, { transform: [{ scale: iconScale }] }]}>
            <Gift color="#B45309" size={96} strokeWidth={2.1} />
          </Animated.View>
        </View>

        {mode === 'claim' ? (
          <>
            <Text style={styles.amount}>{t('gift.claim.amount', { n: rewardCoins })}</Text>
            <Text style={styles.why}>
              {t(streakBonus ? 'gift.claim.whyStreak' : 'gift.claim.why')}
            </Text>
            <Pressable
              style={[styles.claimBtn, busy && styles.claimBtnDisabled]}
              onPress={onClaim}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#3A2A1A" />
              ) : (
                <Text style={styles.claimText}>{t('gift.claim.cta')}</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.amount}>
              {claimed
                ? t('gift.claim.amount', { n: rewardCoins })
                : t('gift.info.unclaimed')}
            </Text>
            <Text style={styles.why}>
              {t(streakBonus ? 'gift.claim.whyStreak' : 'gift.claim.why')}
            </Text>
          </>
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  iconStage: {
    width: STAGE,
    height: STAGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftBadge: {
    width: 176,
    height: 176,
    borderRadius: 88,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5C542',
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiPiece: {
    position: 'absolute',
  },
  amount: {
    marginTop: -18,
    fontSize: 32,
    fontWeight: '800',
    color: '#F5C542',
    textAlign: 'center',
  },
  why: {
    marginTop: 8,
    maxWidth: 260,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: 'rgba(255, 248, 238, 0.88)',
    textAlign: 'center',
  },
  claimBtn: {
    marginTop: 22,
    minWidth: 180,
    backgroundColor: '#F5C542',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  claimBtnDisabled: {
    opacity: 0.7,
  },
  claimText: {
    color: '#3A2A1A',
    fontWeight: '800',
    fontSize: 16,
  },
});
