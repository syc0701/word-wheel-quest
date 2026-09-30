import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Shield, Trophy } from 'lucide-react-native';
import { useT } from '../context/LanguageContext';

const THEMES = {
  CLASSIC: {
    titleKey: 'pack.complete.classic.title',
    primaryKey: 'pack.complete.next',
    secondary: 'close',
    icon: Trophy,
    background: '#FFF7ED',
    card: '#FFFBEB',
    ink: '#78350F',
    muted: '#92400E',
    accent: '#D97706',
    gradient: ['#FDE68A', '#D97706'],
    glow: 'rgba(245, 158, 11, 0.45)',
    particle: '#F59E0B',
  },
  HARD_QUEST: {
    titleKey: 'pack.complete.hard.title',
    primaryKey: 'pack.complete.next',
    secondary: 'share',
    icon: Shield,
    background: '#1C1917',
    card: '#292524',
    ink: '#FAFAF9',
    muted: '#D6D3D1',
    accent: '#E7C27A',
    gradient: ['#78716C', '#44403C'],
    glow: 'rgba(231, 194, 122, 0.4)',
    particle: '#F97316',
  },
  MASTER: {
    titleKey: 'pack.complete.master.title',
    primaryKey: 'pack.complete.next',
    secondary: 'share',
    icon: Crown,
    background: '#2E1065',
    card: '#4C1D95',
    ink: '#FAF5FF',
    muted: '#E9D5FF',
    accent: '#F5D061',
    gradient: ['#C4B5FD', '#6D28D9'],
    glow: 'rgba(167, 139, 250, 0.55)',
    particle: '#F5D061',
  },
};

export function packCompletionType(code) {
  if (code === 'hard_quest') return 'HARD_QUEST';
  if (code === 'master') return 'MASTER';
  return 'CLASSIC';
}

function statRows(packType, stats) {
  const rows = [];
  const push = (key, value) => {
    if (value == null || value === '') return;
    rows.push({ key, value: String(value) });
  };
  if (packType === 'HARD_QUEST') {
    push('hints', stats.hintsUsed);
    push('accuracy', stats.accuracy);
  } else if (packType === 'MASTER') {
    push('time', stats.completionTime);
    push('words', stats.totalWords);
  } else {
    push('puzzles', stats.totalPuzzles);
    push('words', stats.totalWords);
  }
  if (!rows.length) push('puzzles', stats.totalPuzzles);
  return rows;
}

function DriftBits({ theme, kind }) {
  const bits = useRef(
    [0, 1, 2, 3, 4].map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const loops = bits.map((value, index) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(index * 180),
          Animated.timing(value, {
            toValue: 1,
            duration: kind === 'spark' ? 700 : 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: kind === 'spark' ? 500 : 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return loop;
    });
    return () => loops.forEach((loop) => loop.stop());
  }, [bits, kind]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bits.map((value, index) => {
        const translateY = value.interpolate({
          inputRange: [0, 1],
          outputRange: kind === 'star' ? [8, -18] : [0, -6],
        });
        const opacity = value.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0.25, 1, 0.3],
        });
        return (
          <Animated.View
            key={index}
            style={[
              kind === 'star' ? styles.star : styles.spark,
              {
                backgroundColor: theme.particle,
                left: 28 + index * 52,
                top: kind === 'star' ? 18 : 36,
                opacity,
                transform: [{ translateY }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function PackCompletionModal({
  visible,
  packType = 'CLASSIC',
  stats = {},
  onClaimBonus,
  onNextPack,
  onClose,
}) {
  const t = useT();
  const theme = THEMES[packType] || THEMES.CLASSIC;
  const Icon = theme.icon;
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const aura = useRef(new Animated.Value(0.45)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!visible) {
      setClaimed(false);
      return undefined;
    }
    fade.setValue(0);
    scale.setValue(0.88);
    const enter = Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);
    enter.start();
    const auraLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(aura, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(aura, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const shine = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
    auraLoop.start();
    shine.start();
    return () => {
      enter.stop();
      auraLoop.stop();
      shine.stop();
    };
  }, [aura, fade, scale, shimmer, visible]);

  const rows = statRows(packType, stats);
  const shineX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-160, 260],
  });

  const claim = () => {
    if (claimed) return;
    setClaimed(true);
    onClaimBonus?.();
  };

  const share = async () => {
    try {
      await Share.share({ message: t(theme.titleKey) });
    } catch {
      /* the player dismissed the share sheet */
    }
  };

  const leave = () => {
    (onClose || onNextPack)?.();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={leave}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Animated.View style={[styles.cardWrap, { transform: [{ scale }] }]}>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent }]}>
            {packType === 'CLASSIC' ? <DriftBits theme={theme} kind="star" /> : null}
            {packType === 'HARD_QUEST' ? <DriftBits theme={theme} kind="spark" /> : null}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.aura,
                {
                  backgroundColor: theme.glow,
                  opacity: packType === 'MASTER' ? aura : 0.35,
                  transform: [{ scale: packType === 'MASTER' ? aura : 1 }],
                },
              ]}
            />
            <View style={[styles.iconRing, { borderColor: theme.accent, backgroundColor: theme.background }]}>
              <Icon color={theme.accent} size={34} strokeWidth={2.2} />
            </View>
            <Text style={[styles.title, { color: theme.ink }]}>{t(theme.titleKey)}</Text>
            <View style={styles.stats}>
              {rows.map((row) => (
                <View key={row.key} style={[styles.stat, { borderColor: theme.glow }]}>
                  <Text style={[styles.statValue, { color: theme.ink }]}>{row.value}</Text>
                  <Text style={[styles.statLabel, { color: theme.muted }]}>
                    {t(`pack.complete.stat.${row.key}`)}
                  </Text>
                </View>
              ))}
            </View>
            <Pressable
              style={[styles.claim, claimed && styles.claimDone]}
              onPress={claim}
              disabled={claimed}
            >
              <LinearGradient
                colors={theme.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {!claimed ? (
                <Animated.View
                  pointerEvents="none"
                  style={[styles.shimmer, { transform: [{ translateX: shineX }] }]}
                />
              ) : null}
              <Text style={styles.claimText}>
                {t(claimed ? 'pack.complete.claimed' : 'pack.complete.claim')}
              </Text>
            </Pressable>
            <Pressable style={[styles.primary, { backgroundColor: theme.accent }]} onPress={onNextPack}>
              <Text style={[styles.primaryText, { color: theme.background }]}>
                {t(theme.primaryKey)}
              </Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={theme.secondary === 'share' ? share : leave}>
              <Text style={[styles.secondaryText, { color: theme.muted }]}>
                {t(theme.secondary === 'share' ? 'pack.complete.share' : 'pack.complete.close')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 24, 28, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 360,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  aura: {
    position: 'absolute',
    top: 18,
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  stats: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '46%',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  claim: {
    marginTop: 18,
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimDone: {
    opacity: 0.85,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 70,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  claimText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  primary: {
    marginTop: 10,
    alignSelf: 'stretch',
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '800',
  },
  secondary: {
    marginTop: 8,
    paddingVertical: 8,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  star: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  spark: {
    position: 'absolute',
    width: 5,
    height: 14,
    borderRadius: 3,
  },
});
