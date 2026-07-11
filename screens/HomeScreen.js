import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar, ChevronRight, Play, Settings } from 'lucide-react-native';
import WordWheelApi from '../lib/api';
import { parseWords } from '../lib/gridReveal';
import { resolveJourneyLevel, resolvePuzzleWordCount } from '../lib/puzzleLevel';
import { SCREENS, PLAY_MODE } from '../constants/theme';
import { useAppearance } from '../context/AppearanceContext';

function formatDifficulty(level) {
  const raw = String(level || '').trim();
  if (!raw) return '';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

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

function MenuRow({ icon: Icon, label, subtitle, onPress, colors }) {
  return (
    <Pressable
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
      ]}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.surfaceLight }]}>
        <Icon color={colors.primaryGlow} size={20} strokeWidth={1.8} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      <ChevronRight color={colors.textMuted} size={20} />
    </Pressable>
  );
}

export default function HomeScreen({ navigate }) {
  const { colors } = useAppearance();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [puzzle, setPuzzle] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await WordWheelApi.fetchNext();
        logHomePuzzle(data, 'api');
        if (data?.code === 'NO_DATA') {
          if (!cancelled) setError('No word wheel puzzle available yet.');
          return;
        }
        if (data?.code === 'FAILURE') {
          if (!cancelled) {
            setPuzzle(null);
            setError(data?.message || 'Could not load the next puzzle.');
          }
          return;
        }
        if (!data?.id) {
          if (!cancelled) {
            setPuzzle(null);
            setError('Next puzzle response was missing puzzle data.');
          }
          return;
        }
        if (!cancelled) setPuzzle(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load puzzle');
      } finally {
        if (!cancelled) setLoading(false);
      }
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

  useEffect(() => {
    if (!puzzle) return;
    logHomePuzzle(puzzle, 'render');
  }, [puzzle]);

  const canPlay = Boolean(puzzle) && !loading && !error;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <Pressable
          style={[styles.topIconBtn, { backgroundColor: colors.surface }]}
          onPress={() => navigate(SCREENS.SETTINGS, { backScreen: SCREENS.HOME })}
          accessibilityLabel="Settings"
          hitSlop={8}
        >
          <Settings color={colors.text} size={22} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.kicker, { color: colors.textMuted }]}>PUZZLE COLLECTION</Text>
        <Text style={[styles.title, { color: colors.text }]}>Word Wheel Quest</Text>
        <Text style={[styles.tagline, { color: colors.textMuted }]}>
          Swipe letters. Find every word.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Season Journey</Text>
        <View
          style={[
            styles.journeyCard,
            { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryGlow} style={styles.cardLoader} />
          ) : error ? (
            <Text style={styles.cardError}>{error}</Text>
          ) : puzzle ? (
            <>
              <View style={styles.levelRow}>
                {journeyLevel != null ? (
                  <Text style={[styles.levelHero, { color: colors.text }]}>
                    Level {journeyLevel}
                  </Text>
                ) : (
                  <View style={styles.levelHeroSpacer} />
                )}
                {puzzle.difficultyLevel ? (
                  <View
                    style={[
                      styles.difficultyChip,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text style={[styles.difficultyChipText, { color: colors.primaryGlow }]}>
                      {formatDifficulty(puzzle.difficultyLevel)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.puzzleTitle, { color: colors.text }]} numberOfLines={2}>
                {puzzle.title}
              </Text>
              {wordCount > 0 ? (
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {wordCount} words
                </Text>
              ) : null}
            </>
          ) : null}

          <Pressable
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary },
              !canPlay && styles.primaryBtnDisabled,
            ]}
            disabled={!canPlay}
            onPress={() => navigate(SCREENS.PLAY, { mode: PLAY_MODE.JOURNEY })}
          >
            <Play color="#fff" size={18} strokeWidth={2.4} fill="#fff" />
            <Text style={styles.primaryBtnText}>Play</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>More</Text>
        <MenuRow
          icon={Calendar}
          label="Daily Puzzle"
          subtitle="Today's bonus — separate from the season journey"
          onPress={() => navigate(SCREENS.DAILY)}
          colors={colors}
        />

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          Progress is saved on this device. Sign in once to move guest progress to your account.
        </Text>
      </ScrollView>
    </View>
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
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  tagline: {
    fontSize: 15,
    marginTop: 6,
    marginBottom: 8,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 10,
  },
  journeyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
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
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.6,
    flexShrink: 1,
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
  difficultyChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  difficultyChipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  puzzleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 22,
  },
  meta: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
  },
  primaryBtn: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
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
  footer: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
  },
});
