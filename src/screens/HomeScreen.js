import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Calendar,
  ChevronRight,
  Cloud,
  Play,
  Search,
  Settings,
  ShoppingCart,
} from 'lucide-react-native';
import AdBanner from '../components/AdBanner';
import GradientBackground from '../components/GradientBackground';
import WordWheelApi from '../lib/api';
import { isLoggedIn } from '../lib/auth';
import { parseWords } from '../lib/gridReveal';
import { resolveJourneyLevel, resolvePuzzleWordCount } from '../lib/puzzleLevel';
import { SCREENS, PLAY_MODE } from '../constants/theme';
import { hasCompletedOnboarding } from '../lib/onboarding';
import { APPEARANCE_DARK } from '../lib/appearance';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WHEEL_ART = require('../assets/icon.png');

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

function useHomePalette() {
  const { colors, mode, isRandomScene } = useAppearance();
  const isDark = mode === APPEARANCE_DARK;

  return useMemo(() => {
    const title = isRandomScene
      ? {
          color: '#ffffff',
          textShadowColor: 'rgba(0, 0, 0, 0.55)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 6,
        }
      : { color: colors.text };

    const comment = isRandomScene
      ? {
          color: 'rgba(255, 255, 255, 0.9)',
          textShadowColor: 'rgba(0, 0, 0, 0.45)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        }
      : { color: colors.textMuted };

    // Level card: warm gold / cream (matches home mock).
    const LEVEL_CARD = {
      cardBg: '#E3C17D',
      cardBorder: '#CDB069',
      text: '#3A2A1A',
      muted: 'rgba(58, 42, 26, 0.72)',
      badgeBg: 'rgba(58, 42, 26, 0.12)',
      badgeText: '#3A2A1A',
      progressTrack: 'rgba(58, 42, 26, 0.18)',
      progressFill: '#8B6914',
      ctaBg: '#F8EED8',
      ctaText: '#3A2A1A',
    };

    const continueCard = {
      backgroundColor: LEVEL_CARD.cardBg,
      borderColor: LEVEL_CARD.cardBorder,
      shadowColor: '#6B4E1F',
      shadowOpacity: 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    };
    const continueText = LEVEL_CARD.text;
    const continueMuted = LEVEL_CARD.muted;
    const continueCta = { backgroundColor: LEVEL_CARD.ctaBg };
    const continueCtaText = LEVEL_CARD.ctaText;
    const progressTrack = LEVEL_CARD.progressTrack;
    const progressFill = LEVEL_CARD.progressFill;
    const levelBadgeBg = LEVEL_CARD.badgeBg;
    const levelBadgeText = LEVEL_CARD.badgeText;

    const tile = {
      backgroundColor: colors.surface,
      borderColor: isRandomScene ? 'rgba(255,255,255,0.55)' : colors.surfaceLight,
    };

    const tutorialLink = isRandomScene
      ? {
          color: 'rgba(255, 255, 255, 0.92)',
          textShadowColor: 'rgba(0, 0, 0, 0.45)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        }
      : { color: isDark ? colors.primaryGlow : colors.primary };

    return {
      colors,
      isDark,
      isRandomScene,
      title,
      comment,
      continueCard,
      continueText,
      continueMuted,
      continueCta,
      continueCtaText,
      progressTrack,
      progressFill,
      levelBadgeBg,
      levelBadgeText,
      tutorialLink,
      tile,
      settingsBg: isRandomScene ? 'rgba(255,255,255,0.92)' : colors.surface,
      settingsIcon: colors.text,
      dailyIconBg: isDark ? 'rgba(45, 212, 191, 0.16)' : 'rgba(61, 155, 116, 0.14)',
      shopIconBg: isDark ? 'rgba(251, 191, 36, 0.14)' : 'rgba(234, 179, 148, 0.35)',
      signInBorder: isDark ? colors.primary : '#1b4d3e',
      signInText: isDark ? colors.primaryGlow : '#1b4d3e',
    };
  }, [colors, isDark, isRandomScene]);
}

export default function HomeScreen({ navigate }) {
  const palette = useHomePalette();
  const { colors } = palette;
  const { setSceneLevel } = useAppearance();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [puzzle, setPuzzle] = useState(null);
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
  const progress =
    wordCount > 0 ? Math.min(1, Math.max(0, foundCount / wordCount)) : 0;
  const canPlay = Boolean(puzzle) && !loading && !error;

  const handleContinue = useCallback(async () => {
    if (!canPlay) return;
    const completed = await hasCompletedOnboarding();
    navigate(SCREENS.PLAY, {
      mode: PLAY_MODE.JOURNEY,
      puzzle,
      isOnboarding: !completed,
    });
  }, [canPlay, navigate, puzzle]);

  const handleTutorial = useCallback(() => {
    navigate(SCREENS.PLAY, {
      mode: PLAY_MODE.JOURNEY,
      isOnboarding: true,
    });
  }, [navigate]);

  useEffect(() => {
    if (journeyLevel != null) setSceneLevel(journeyLevel);
  }, [journeyLevel, setSceneLevel]);

  useEffect(() => {
    if (!puzzle) return;
    logHomePuzzle(puzzle, 'render');
  }, [puzzle]);

  const openDaily = useCallback(() => {
    navigate(SCREENS.DAILY);
  }, [navigate]);

  return (
    <GradientBackground variant="home">
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <View style={styles.topBarSpacer} />
          <Pressable
            style={[styles.settingsBtn, { backgroundColor: palette.settingsBg }]}
            onPress={() => navigate(SCREENS.SETTINGS, { backScreen: SCREENS.HOME })}
            accessibilityLabel={t('home.a11y.settings')}
            hitSlop={8}
          >
            <Settings color={palette.settingsIcon} size={20} strokeWidth={1.9} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBlock}>
            <Text style={[styles.titleLine, palette.title]}>{t('home.title.line1')}</Text>
            <Text style={[styles.titleLine, styles.titleLine2, palette.title]}>
              {t('home.title.line2')}
            </Text>
            <Text style={[styles.comment, palette.comment]}>{t('home.comment')}</Text>
          </View>

          <View style={styles.middleBlock}>
            <View style={[styles.continueCard, palette.continueCard]}>
              {loading ? (
                <ActivityIndicator color={palette.continueText} style={styles.cardLoader} />
              ) : error ? (
                <Text style={styles.cardError}>{error}</Text>
              ) : (
                <>
                  <View style={styles.continueTop}>
                    <Image source={WHEEL_ART} style={styles.wheelArt} />
                    <View style={styles.continueMeta}>
                      <View style={[styles.levelBadge, { backgroundColor: palette.levelBadgeBg }]}>
                        <Text style={[styles.levelBadgeText, { color: palette.levelBadgeText }]}>
                          {t('home.continue.badge')}
                        </Text>
                      </View>
                      <Text style={[styles.levelTitle, { color: palette.continueText }]}>
                        {journeyLevel != null
                          ? t('common.level', { n: journeyLevel })
                          : t('common.levelFallback')}
                      </Text>
                      <View
                        style={[styles.progressTrack, { backgroundColor: palette.progressTrack }]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: palette.progressFill,
                              width: `${Math.round(progress * 100)}%`,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.wordsRow}>
                        <Search color={palette.continueMuted} size={14} strokeWidth={2.2} />
                        <Text style={[styles.wordsText, { color: palette.continueMuted }]}>
                          {t('home.continue.wordsFound', {
                            found: Math.min(foundCount, wordCount || 0),
                            total: wordCount || 0,
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Pressable
                    style={[
                      styles.continueBtn,
                      palette.continueCta,
                      !canPlay && styles.btnDisabled,
                    ]}
                    disabled={!canPlay}
                    onPress={handleContinue}
                    accessibilityLabel={t('home.continue.cta')}
                  >
                    <Play
                      color={palette.continueCtaText}
                      size={17}
                      strokeWidth={2.4}
                      fill={palette.continueCtaText}
                    />
                    <Text style={[styles.continueBtnText, { color: palette.continueCtaText }]}>
                      {t('home.continue.cta')}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>

            <Pressable
              style={styles.tutorialLink}
              onPress={handleTutorial}
              accessibilityLabel={t('home.a11y.tutorial')}
              hitSlop={10}
            >
              <Text style={[styles.tutorialLinkText, palette.tutorialLink]}>
                {t('home.tutorial.link')}
              </Text>
            </Pressable>
          </View>

          <View style={styles.bottomBlock}>
            <View style={styles.tileRow}>
              <Pressable style={[styles.tile, palette.tile]} onPress={openDaily}>
                <View style={styles.tileHeader}>
                  <View style={[styles.tileIcon, { backgroundColor: palette.dailyIconBg }]}>
                    <Calendar color={colors.primaryGlow} size={18} strokeWidth={1.9} />
                  </View>
                  <Text style={[styles.tileTitle, { color: colors.text }]} numberOfLines={2}>
                    {t('home.dailyPuzzle.label')}
                  </Text>
                </View>
                <Text style={[styles.tileSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
                  {t('home.dailyPuzzle.subtitle')}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tile, palette.tile]}
                onPress={() => navigate(SCREENS.SHOP, { backScreen: SCREENS.HOME })}
              >
                <View style={styles.tileHeader}>
                  <View style={[styles.tileIcon, { backgroundColor: palette.shopIconBg }]}>
                    <ShoppingCart color={colors.text} size={18} strokeWidth={1.9} />
                  </View>
                  <Text style={[styles.tileTitle, { color: colors.text }]} numberOfLines={1}>
                    {t('home.shop.label')}
                  </Text>
                  <ChevronRight color={colors.textMuted} size={16} />
                </View>
                <Text style={[styles.tileSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
                  {t('home.shop.subtitle')}
                </Text>
              </Pressable>
            </View>

            {guest ? (
              <View style={[styles.guestCard, palette.tile]}>
                <View style={[styles.guestIcon, { backgroundColor: palette.dailyIconBg }]}>
                  <Cloud color={colors.primaryGlow} size={22} strokeWidth={1.8} />
                </View>
                <View style={styles.guestBody}>
                  <Text style={[styles.guestTitle, { color: colors.text }]}>
                    {t('home.guest.title')}
                  </Text>
                  <Text style={[styles.guestBodyText, { color: colors.textMuted }]}>
                    {t('home.guest.body')}
                  </Text>
                </View>
                <Pressable
                  style={[styles.signInBtn, { borderColor: palette.signInBorder }]}
                  onPress={() => navigate(SCREENS.SIGN_IN, { backScreen: SCREENS.HOME })}
                >
                  <Text style={[styles.signInBtnText, { color: palette.signInText }]}>
                    {t('home.guest.signIn')}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <AdBanner />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 2,
  },
  topBarSpacer: {
    flex: 1,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
  },
  headerBlock: {
    paddingTop: 4,
  },
  middleBlock: {
    // Grows to centre the card when there is room, but keeps its natural height
    // on short screens instead of collapsing and spilling over the neighbours.
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 'auto',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  bottomBlock: {
    gap: 12,
    paddingBottom: 4,
  },
  titleLine: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  titleLine2: {
    marginTop: -2,
  },
  comment: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 21,
  },
  continueCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
  },
  cardLoader: {
    marginVertical: 36,
  },
  cardError: {
    color: '#dc2626',
    fontSize: 14,
    lineHeight: 20,
  },
  continueTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  wheelArt: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  continueMeta: {
    flex: 1,
    minWidth: 0,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  levelTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  progressTrack: {
    marginTop: 10,
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  wordsRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  continueBtn: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnText: {
    fontSize: 17,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  tutorialLink: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tutorialLinkText: {
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  tile: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tileIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  tileSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  guestCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBody: {
    flex: 1,
    minWidth: 0,
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  guestBodyText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
  },
  signInBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'transparent',
  },
  signInBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
