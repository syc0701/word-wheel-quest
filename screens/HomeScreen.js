import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar, Settings } from 'lucide-react-native';
import GradientBackground from '../components/GradientBackground';
import WordWheelApi from '../lib/api';
import { parseWords } from '../lib/gridReveal';
import { resolveJourneyLevel, resolvePuzzleWordCount } from '../lib/puzzleLevel';
import { SCREENS, WW, PLAY_MODE } from '../constants/theme';

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

export default function HomeScreen({ navigate }) {
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

  useEffect(() => {
    if (!puzzle) return;
    logHomePuzzle(puzzle, 'render');
  }, [puzzle]);

  return (
    <GradientBackground variant="home">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>PUZZLE COLLECTION</Text>
        <Text style={styles.title}>Word Wheel Quest</Text>
        <Text style={styles.tagline}>Swipe letters. Find every word.</Text>

        <View style={styles.card}>
          <Text style={styles.cardMode}>Season Journey</Text>

          {loading ? (
            <ActivityIndicator color={WW.accent} style={styles.cardLoader} />
          ) : error ? (
            <Text style={styles.cardError}>{error}</Text>
          ) : puzzle ? (
            <>
              {journeyLevel != null && (
                <Text style={styles.levelHero}>Level {journeyLevel}</Text>
              )}
              <Text style={styles.puzzleTitle}>{puzzle.title}</Text>
            </>
          ) : null}
        </View>

        <Pressable
          style={[styles.primaryBtn, !puzzle && styles.primaryBtnDisabled]}
          disabled={!puzzle}
          onPress={() => navigate(SCREENS.PLAY, { mode: PLAY_MODE.JOURNEY })}
        >
          <Text style={styles.primaryBtnText}>Play</Text>
        </Pressable>

        <Text style={styles.footer}>
          Progress is saved on this device. Sign in once to move guest progress to your account.
        </Text>

        <View style={styles.dailySection}>
          <Text style={styles.dailyHint}>Today&apos;s bonus puzzle — separate from the season journey</Text>
          <View style={styles.dailyRow}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => navigate(SCREENS.DAILY)}
              accessibilityLabel="Daily Puzzle"
              hitSlop={8}
            >
              <Calendar color={WW.accent} size={22} strokeWidth={1.8} />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => navigate(SCREENS.SETTINGS, { backScreen: SCREENS.HOME })}
              accessibilityLabel="Settings"
              hitSlop={8}
            >
              <Settings color={WW.accent} size={22} strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32,
    alignItems: 'center',
  },
  kicker: {
    color: WW.accent,
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: '700',
    marginBottom: 10,
  },
  title: {
    color: WW.text,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  tagline: {
    color: WW.textSecondary,
    fontSize: 15,
    marginTop: 10,
    marginBottom: 28,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    minHeight: 220,
    backgroundColor: WW.surface,
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: WW.border,
    marginBottom: 24,
  },
  cardMode: {
    color: WW.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  levelHero: {
    color: WW.text,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  cardLoader: {
    marginVertical: 24,
  },
  cardError: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 20,
  },
  puzzleTitle: {
    color: WW.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: WW.accent,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    color: WW.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
    maxWidth: 300,
  },
  dailySection: {
    width: '100%',
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: WW.border,
    alignItems: 'center',
  },
  dailyHint: {
    color: WW.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: WW.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WW.surface,
  },
});
