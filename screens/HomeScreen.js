import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Settings } from 'lucide-react-native';
import GradientBackground from '../components/GradientBackground';
import WordWheelApi from '../lib/api';
import { resolveWordWheelGridSize } from '../lib/constants';
import { parseWords } from '../lib/gridReveal';
import { SCREENS, WW, PLAY_MODE } from '../constants/theme';

function resolveJourneyLevel(puzzle) {
  if (puzzle?.mainJourneyLevel != null && Number.isFinite(Number(puzzle.mainJourneyLevel))) {
    return Number(puzzle.mainJourneyLevel);
  }
  if (puzzle?.puzzleLevel != null && Number.isFinite(Number(puzzle.puzzleLevel))) {
    return Number(puzzle.puzzleLevel);
  }
  return null;
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
        if (data?.code === 'NO_DATA') {
          if (!cancelled) setError('No word wheel puzzle available yet.');
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

  const words = useMemo(() => parseWords(puzzle?.wordsInUse), [puzzle]);
  const gridSize = useMemo(() => resolveWordWheelGridSize(puzzle), [puzzle]);
  const journeyLevel = useMemo(() => resolveJourneyLevel(puzzle), [puzzle]);

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
              <Text style={styles.puzzleMeta}>
                {words.length} words · {gridSize}×{gridSize} grid
                {puzzle.season ? ` · ${puzzle.season.replace(/_/g, ' ')}` : ''}
              </Text>
            </>
          ) : null}

          <Text style={styles.cardRange}>Levels 1 → 1000</Text>
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
            <Pressable style={styles.outlineBtn} onPress={() => navigate(SCREENS.DAILY)}>
              <Text style={styles.outlineBtnText}>Daily Puzzle</Text>
            </Pressable>
            <Pressable
              style={styles.settingsBtn}
              onPress={() => navigate(SCREENS.SETTINGS, { backScreen: SCREENS.HOME })}
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
    maxWidth: 320,
    backgroundColor: WW.surface,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
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
    marginBottom: 12,
  },
  levelHero: {
    color: WW.text,
    fontSize: 40,
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
  cardRange: {
    color: WW.textMuted,
    fontSize: 12,
    marginTop: 16,
  },
  puzzleTitle: {
    color: WW.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  puzzleMeta: {
    color: WW.textSecondary,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
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
    gap: 10,
    width: '100%',
    maxWidth: 320,
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: WW.accent,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  settingsBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: WW.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WW.surface,
  },
  outlineBtnText: {
    color: WW.accent,
    fontSize: 16,
    fontWeight: '700',
  },
});
