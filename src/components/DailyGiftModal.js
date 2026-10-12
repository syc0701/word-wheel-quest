import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Coins, Gift } from 'lucide-react-native';
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

function PulseRing({ play, delay, size }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!play) {
      progress.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [play, delay, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: progress.interpolate({
            inputRange: [0, 0.12, 1],
            outputRange: [0, 0.7, 0],
          }),
          transform: [{
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 1.38],
            }),
          }],
        },
      ]}
    />
  );
}

function coinUnit(label, n) {
  return String(label).replace(`+${n}`, '').replace(String(n), '').trim();
}

function RewardMark({ play, coins, burstId }) {
  const enter = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const numberScale = useRef(new Animated.Value(0.4)).current;
  const [shown, setShown] = useState(0);
  const target = Math.max(1, Math.floor(Number(coins) || BASE_COINS));

  useEffect(() => {
    if (!play) {
      enter.setValue(0);
      pulse.setValue(0);
      numberScale.setValue(0.4);
      setShown(0);
      return undefined;
    }
    enter.setValue(0);
    pulse.setValue(0);
    numberScale.setValue(0.4);
    setShown(0);
    let pulseLoop;
    const intro = Animated.spring(enter, {
      toValue: 1,
      friction: 4,
      tension: 160,
      useNativeDriver: true,
    });
    intro.start(({ finished }) => {
      if (!finished) return;
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 460,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 460,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.start();
    });
    const timers = [];
    for (let step = 1; step <= target; step += 1) {
      timers.push(setTimeout(() => {
        setShown(step);
        numberScale.setValue(step === target ? 0.55 : 0.82);
        Animated.spring(numberScale, {
          toValue: 1,
          friction: step === target ? 3.2 : 6,
          tension: step === target ? 180 : 220,
          useNativeDriver: true,
        }).start();
      }, 260 + step * 170));
    }
    return () => {
      intro.stop();
      pulseLoop?.stop();
      timers.forEach(clearTimeout);
    };
  }, [play, target, enter, pulse, numberScale]);

  const iconScale = useMemo(() => Animated.add(
    enter.interpolate({
      inputRange: [0, 1],
      outputRange: [0.15, 1],
      extrapolate: 'clamp',
    }),
    pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.07],
    }),
  ), [enter, pulse]);
  const iconTilt = useMemo(() => enter.interpolate({
    inputRange: [0, 0.4, 0.7, 1],
    outputRange: ['-16deg', '8deg', '-4deg', '0deg'],
    extrapolate: 'clamp',
  }), [enter]);
  const glowOpacity = useMemo(() => pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.7],
  }), [pulse]);

  const label = `+${shown || target}`;

  return (
    <View style={styles.rewardBlock}>
      <View style={styles.iconStage}>
        <GiftConfetti play={play} burstId={burstId} />
        <PulseRing play={play} delay={0} size={200} />
        <PulseRing play={play} delay={480} size={228} />
        <Animated.View
          pointerEvents="none"
          style={[styles.halo, { opacity: glowOpacity, transform: [{ scale: iconScale }] }]}
        />
        <Animated.View
          style={[
            styles.giftBadge,
            { transform: [{ scale: iconScale }, { rotate: iconTilt }] },
          ]}
        >
          <Gift color="#B45309" size={92} strokeWidth={2.2} />
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.amountRow,
          { opacity: shown > 0 ? 1 : 0, transform: [{ scale: numberScale }] },
        ]}
      >
        <Coins color="#FFE08A" size={36} strokeWidth={2.4} />
        <View style={styles.numberWrap}>
          <Animated.Text style={[styles.amountGlow, { opacity: glowOpacity }]}>
            {label}
          </Animated.Text>
          <Text style={styles.amountHero}>{label}</Text>
        </View>
      </Animated.View>
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
  const days = Math.max(0, Math.floor(Number(streakDays ?? streak) || 0));
  const streakBonus = typeof isStreak === 'boolean' ? isStreak : days >= 2;
  const rewardCoins = coins > 0 ? coins : (streakBonus ? STREAK_COINS : BASE_COINS);
  const showReward = mode === 'claim' || claimed;

  useEffect(() => {
    if (!visible) return undefined;
    setBurstId((id) => id + 1);
    return undefined;
  }, [visible]);

  const unit = coinUnit(t('gift.claim.amount', { n: rewardCoins }), rewardCoins);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {showReward ? (
            <RewardMark play={visible} coins={rewardCoins} burstId={burstId} />
          ) : (
            <View style={styles.iconStage}>
              <View style={styles.giftBadge}>
                <Gift color="#B45309" size={92} strokeWidth={2.2} />
              </View>
            </View>
          )}

          {showReward ? (
            <Text style={styles.amountUnit}>{unit}</Text>
          ) : (
            <Text style={styles.amount}>{t('gift.info.unclaimed')}</Text>
          )}
          <Text style={styles.why}>
            {t(streakBonus ? 'gift.claim.whyStreak' : 'gift.claim.why')}
          </Text>
          {mode === 'claim' ? (
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
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    alignItems: 'center',
    width: '100%',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  rewardBlock: {
    alignItems: 'center',
  },
  iconStage: {
    width: STAGE,
    height: STAGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: 'rgba(245, 197, 66, 0.28)',
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(255, 224, 138, 0.85)',
  },
  giftBadge: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5C542',
    shadowColor: '#F5C542',
    shadowOpacity: 0.85,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiPiece: {
    position: 'absolute',
  },
  amountRow: {
    marginTop: -36,
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  numberWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '900',
    color: '#F5C542',
    textShadowColor: '#F5C542',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  amountHero: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '900',
    color: '#FFF6D0',
    textAlign: 'center',
    textShadowColor: 'rgba(245, 197, 66, 0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  amountUnit: {
    marginTop: -6,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#F6D78A',
    textAlign: 'center',
  },
  amount: {
    marginTop: -8,
    fontSize: 22,
    lineHeight: 28,
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
