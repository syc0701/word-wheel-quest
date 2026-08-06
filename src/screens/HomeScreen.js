import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  ChevronRight,
  Lock,
  Play,
  Settings,
  ShoppingBag,
  User,
} from 'lucide-react-native';
import DailyLockedModal from '../components/DailyLockedModal';
import GradientBackground from '../components/GradientBackground';
import WordWheelApi from '../lib/api';
import { isLoggedIn } from '../lib/auth';
import { parseWords } from '../lib/gridReveal';
import { resolveJourneyLevel, resolvePuzzleWordCount } from '../lib/puzzleLevel';
import { WORD_WHEEL_DAILY_UNLOCK_LEVEL } from '../constants/api';
import { SCREENS, PLAY_MODE } from '../constants/theme';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';

const CARD_WHITE = 'rgba(255, 255, 255, 0.96)';
const CARD_WHITE_BORDER = 'rgba(255, 255, 255, 0.7)';
const CARD_INK = '#0b3d36';
const CARD_INK_MUTED = 'rgba(11, 61, 54, 0.62)';
const DAILY_FROST = 'rgba(18, 28, 36, 0.72)';
const DAILY_FROST_BORDER = 'rgba(255, 255, 255, 0.18)';
const LOCK_GOLD = '#f5d78e';
const MAX_PROGRESS_DOTS = 8;

function logHomePuzzle(data, source) {
  const wordsInUse = data?.wordsInUse;
  console.log('[Home] fetchNext', {
    source,
    code: data?.code,
    message: data?.message,
    id: data?.id,
    title: data?.title,
    wordsInUse: typeof wordsInUse === 'string' ? wordsInUse.slice(0, 120) : wordsInUse,
    wordsParsed: parseWords(wordsInUse).length,
    wordsTotal: data?.wordsTotal,
    detailsWordCount: data?.details?.wordCount,
    resolvedWordCount: data?.id ? resolvePuzzleWordCount(data) : 0,
    mainJourneyLevel: data?.mainJourneyLevel,
    puzzleLevel: data?.puzzleLevel,
    season: data?.season,
    playMode: data?.playMode,
    gridSize: data?.gridSize,
  });
}

function resolveFoundWordCount(puzzle) {
  if (!puzzle) return 0;
  const raw = puzzle.wordsFound ?? puzzle.foundWords;
  if (Array.isArray(raw)) return raw.filter(Boolean).length;
  if (typeof raw === 'string') {
    return raw
      .split(/[\s,|]+/)
      .map((w) => w.trim())
      .filter(Boolean).length;
  }
  const n = Number(puzzle.wordsFoundCount ?? puzzle.foundCount);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function WordProgressDots({ found, total, fillColor, emptyColor }) {
  const count = Math.min(Math.max(0, total), MAX_PROGRESS_DOTS);
  if (count <= 0) return null;
  return (
    <View style={styles.progressDots} accessibilityElementsHidden>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            { backgroundColor: i < found ? fillColor : emptyColor },
          ]}
        />
      ))}
    </View>
  );
}

function ShopRow({ onPress, t }) {
  return (
    <Pressable
      style={[styles.row, styles.shopRow]}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, styles.shopIcon]}>
        <ShoppingBag color={CARD_INK} size={20} strokeWidth={1.8} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, { color: CARD_INK }]}>{t('home.shop.label')}</Text>
        <Text style={[styles.rowSubtitle, { color: CARD_INK_MUTED }]}>
          {t('home.shop.subtitle')}
        </Text>
      </View>
      <ChevronRight color={CARD_INK_MUTED} size={20} />
    </Pressable>
  );
}

function DailyRow({ locked, unlockLevel, onPress, t }) {
  return (
    <Pressable
      style={[styles.row, styles.dailyRow, locked && styles.dailyRowLocked]}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, styles.dailyIcon]}>
        <Calendar color="#ffffff" size={20} strokeWidth={1.8} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, styles.dailyLabel]}>
          {t('home.dailyPuzzle.label')}
        </Text>
        {locked ? (
          <View style={styles.lockBadge}>
            <Lock color={LOCK_GOLD} size={13} strokeWidth={2.4} />
            <Text style={styles.lockBadgeText}>
              {t('home.dailyPuzzle.lockedSubtitle', { n: unlockLevel })}
            </Text>
          </View>
        ) : (
          <Text style={styles.dailySubtitle}>{t('home.dailyPuzzle.subtitle')}</Text>
        )}
      </View>
      {locked ? (
        <Lock color={LOCK_GOLD} size={18} strokeWidth={2.2} />
      ) : (
        <ChevronRight color="rgba(255,255,255,0.7)" size={20} />
      )}
    </Pressable>
  );
}

export default function HomeScreen({ navigate }) {
  const { colors } = useAppearance();
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [puzzle, setPuzzle] = useState(null);
  const [dailyLockedVisible, setDailyLockedVisible] = useState(false);
  const [guest, setGuest] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await WordWheelApi.fetchNext();
        logHomePuzzle(data, 'api');
        if (data?.code === 'NO_DATA') {
          if (!cancelled) setError(t('home.error.noData'));
          return;
        }
        if (data?.code === 'FAILURE') {
          if (!cancelled) {
            setPuzzle(null);
            setError(data?.message || t('home.error.loadFailed'));
          }
          return;
        }
        if (!data?.id) {
          if (!cancelled) {
            setPuzzle(null);
            setError(t('home.error.missingData'));
          }
          return;
        }
        if (!cancelled) setPuzzle(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || t('home.error.generic'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loggedIn = await isLoggedIn();
      if (!cancelled) setGuest(!loggedIn);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const journeyLevel = useMemo(() => resolveJourneyLevel(puzzle), [puzzle]);
  const wordCount = useMemo(
    () => (puzzle?.id ? resolvePuzzleWordCount(puzzle) : 0),
    [puzzle]
  );
  const foundCount = useMemo(() => resolveFoundWordCount(puzzle), [puzzle]);
  const dailyUnlocked =
    journeyLevel != null && journeyLevel >= WORD_WHEEL_DAILY_UNLOCK_LEVEL;

  useEffect(() => {
    if (!puzzle) return;
    logHomePuzzle(puzzle, 'render');
  }, [puzzle]);

  const canPlay = Boolean(puzzle) && !loading && !error;

  const openDaily = () => {
    if (dailyUnlocked) {
      navigate(SCREENS.DAILY);
      return;
    }
    setDailyLockedVisible(true);
  };

  const playLabel = t('home.journey.playLevel');

  return (
    <GradientBackground variant="home">
      <View style={styles.container}>
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0.30)', 'rgba(0,0,0,0.16)', 'transparent']}
          locations={[0, 0.45, 1]}
          style={styles.topScrim}
        />

        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <Pressable
            style={styles.topIconBtn}
            onPress={() => navigate(SCREENS.SETTINGS, { backScreen: SCREENS.HOME })}
            accessibilityLabel={t('home.a11y.settings')}
            hitSlop={8}
          >
            <Settings color="#ffffff" size={22} strokeWidth={1.8} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('home.title')}</Text>
          <Text style={styles.tagline}>{t('home.tagline')}</Text>

          <Text style={styles.sectionTitle}>{t('home.section.seasonJourney')}</Text>
          <View style={styles.journeyCard}>
            {loading ? (
              <ActivityIndicator color={colors.primaryGlow} style={styles.cardLoader} />
            ) : error ? (
              <Text style={styles.cardError}>{error}</Text>
            ) : puzzle ? (
              <>
                <View style={styles.levelRow}>
                  {journeyLevel != null ? (
                    <Text style={styles.levelHero}>
                      {t('common.level', { n: journeyLevel })}
                    </Text>
                  ) : (
                    <View style={styles.levelHeroSpacer} />
                  )}
                </View>
                {wordCount > 0 ? (
                  <View style={styles.wordsFoundRow}>
                    <Text style={styles.wordsFoundText}>
                      {t('home.journey.wordsFound', {
                        found: Math.min(foundCount, wordCount),
                        total: wordCount,
                      })}
                    </Text>
                    <WordProgressDots
                      found={Math.min(foundCount, wordCount)}
                      total={wordCount}
                      fillColor={colors.primary}
                      emptyColor="rgba(11, 61, 54, 0.18)"
                    />
                  </View>
                ) : null}
              </>
            ) : null}

            <Pressable
              style={[styles.primaryBtn, !canPlay && styles.primaryBtnDisabled]}
              disabled={!canPlay}
              onPress={() =>
                navigate(SCREENS.PLAY, {
                  mode: PLAY_MODE.JOURNEY,
                  puzzle: canPlay ? puzzle : undefined,
                })
              }
              accessibilityLabel={playLabel}
            >
              <Play color="#fff" size={18} strokeWidth={2.4} fill="#fff" />
              <Text style={styles.primaryBtnText}>{playLabel}</Text>
            </Pressable>
          </View>

          <View style={styles.bottomSpacer} />

          <Text style={[styles.sectionTitle, styles.moreSectionTitle]}>
            {t('home.section.more')}
          </Text>
          <DailyRow
            locked={!dailyUnlocked}
            unlockLevel={WORD_WHEEL_DAILY_UNLOCK_LEVEL}
            onPress={openDaily}
            t={t}
          />
          <ShopRow
            onPress={() => navigate(SCREENS.SHOP, { backScreen: SCREENS.HOME })}
            t={t}
          />

          {guest ? (
            <Pressable
              style={styles.guestPill}
              onPress={() => navigate(SCREENS.SIGN_IN, { backScreen: SCREENS.HOME })}
              accessibilityLabel={t('home.guestPill')}
            >
              <User color="#ffffff" size={16} strokeWidth={2.2} />
              <Text style={styles.guestPillText}>{t('home.guestPill')}</Text>
            </Pressable>
          ) : null}

          <Text style={styles.copyright}>{t('home.copyright')}</Text>
        </ScrollView>

        <DailyLockedModal
          visible={dailyLockedVisible}
          onClose={() => setDailyLockedVisible(false)}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    zIndex: 0,
  },
  topBar: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  topBarSpacer: {
    flex: 1,
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  scroll: {
    zIndex: 1,
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: '#ffffff',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: 15,
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.92)',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomSpacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 10,
    color: 'rgba(255, 255, 255, 0.78)',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  moreSectionTitle: {
    marginTop: 8,
  },
  journeyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_WHITE_BORDER,
    backgroundColor: CARD_WHITE,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  cardLoader: {
    marginVertical: 28,
  },
  cardError: {
    color: '#dc2626',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  levelHero: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -0.8,
    flexShrink: 1,
    color: CARD_INK,
  },
  levelHeroSpacer: {
    flex: 1,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  wordsFoundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  wordsFoundText: {
    fontSize: 15,
    fontWeight: '600',
    color: CARD_INK_MUTED,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  primaryBtn: {
    marginTop: 18,
    marginHorizontal: -18,
    marginBottom: -14,
    minHeight: 56,
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0d9488',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  shopRow: {
    backgroundColor: CARD_WHITE,
    borderColor: CARD_WHITE_BORDER,
  },
  shopIcon: {
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
  },
  dailyRow: {
    backgroundColor: DAILY_FROST,
    borderColor: DAILY_FROST_BORDER,
  },
  dailyRowLocked: {
    opacity: 1,
  },
  dailyIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  dailyLabel: {
    color: '#ffffff',
  },
  dailySubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.72)',
  },
  lockBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 215, 142, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 215, 142, 0.45)',
  },
  lockBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: LOCK_GOLD,
    letterSpacing: 0.2,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  guestPill: {
    alignSelf: 'center',
    marginTop: 18,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  guestPillText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  copyright: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: 0.2,
    color: 'rgba(255, 255, 255, 0.72)',
  },
});
