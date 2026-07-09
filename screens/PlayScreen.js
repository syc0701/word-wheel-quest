import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, BookOpen, Lightbulb, Settings, Shuffle } from 'lucide-react-native';
import LetterWheel from '../components/LetterWheel';
import PuzzleGrid from '../components/PuzzleGrid';
import GradientBackground from '../components/GradientBackground';
import WordWheelCompleteDialog from '../components/WordWheelCompleteDialog';
import WordWheelDictionarySheet from '../components/WordWheelDictionarySheet';
import useWordWheelWallet from '../hooks/useWordWheelWallet';
import WordWheelApi from '../lib/api';
import { resolveWordWheelGridSize } from '../lib/constants';
import {
  buildCellWordNumbers,
  buildClueMapFromDisplayClue,
  buildDisplayGrid,
  buildWordToNumberMap,
  findHintStartCandidates,
  findWordsAtCell,
  normalizeWord,
  parseWordPositions,
  parseWords,
  puzzleCellKeys,
} from '../lib/gridReveal';
import {
  formatWordWheelPlayDuration,
  readCoinsEarned,
  readTotalPuzzleCoinsFromPlay,
  WORD_WHEEL_HINT_COST,
} from '../lib/points';
import { buildWheelTiles, lettersForWheel, shuffleWheelTiles } from '../lib/wheelLetters';
import { PLAY_MODE, SCREENS, WW } from '../constants/theme';

const CLUE_PLACEHOLDER = 'Tap a numbered cell to see the clue';
const { width: SCREEN_W } = Dimensions.get('window');

export default function PlayScreen({ navigate, routeParams = {} }) {
  const isDaily = routeParams.mode === PLAY_MODE.DAILY;
  const dailyDate = routeParams.date;
  const wallet = useWordWheelWallet();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [puzzle, setPuzzle] = useState(null);
  const [foundWords, setFoundWords] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [playSession, setPlaySession] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wheelTiles, setWheelTiles] = useState([]);
  const [hintLetters, setHintLetters] = useState(() => new Map());
  const [hintCoinsSpent, setHintCoinsSpent] = useState(0);
  const [hintPending, setHintPending] = useState(false);
  const [playSessionCoins, setPlaySessionCoins] = useState(0);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [completionStats, setCompletionStats] = useState(null);
  const completionShownRef = useRef(false);
  const wheelTilesRef = useRef(wheelTiles);
  const selectedIndicesRef = useRef(selectedIndices);

  wheelTilesRef.current = wheelTiles;
  selectedIndicesRef.current = selectedIndices;

  const targetWords = useMemo(
    () => parseWords(puzzle?.wordsInUse).map(normalizeWord),
    [puzzle]
  );
  const baseWheelLetters = useMemo(
    () => lettersForWheel(targetWords, puzzle?.lettersGrid, puzzle?.details),
    [targetWords, puzzle]
  );
  const wordPositions = useMemo(() => parseWordPositions(puzzle?.filledCoordinates), [puzzle]);
  const puzzleCells = useMemo(() => puzzleCellKeys(wordPositions), [wordPositions]);
  const gridSize = useMemo(() => resolveWordWheelGridSize(puzzle), [puzzle]);
  const displayGrid = useMemo(
    () => buildDisplayGrid(foundWords, wordPositions, hintLetters, gridSize),
    [foundWords, wordPositions, hintLetters, gridSize]
  );
  const hintedCellKeys = useMemo(() => new Set(hintLetters.keys()), [hintLetters]);
  const hintCandidates = useMemo(
    () => findHintStartCandidates(puzzle?.filledCoordinates, foundWords, hintedCellKeys),
    [puzzle?.filledCoordinates, foundWords, hintedCellKeys]
  );
  const cellWordNumbers = useMemo(
    () => buildCellWordNumbers(puzzle?.filledCoordinates),
    [puzzle?.filledCoordinates]
  );
  const wordToNumber = useMemo(
    () => buildWordToNumberMap(puzzle?.filledCoordinates, cellWordNumbers),
    [puzzle?.filledCoordinates, cellWordNumbers]
  );
  const clueMap = useMemo(() => buildClueMapFromDisplayClue(puzzle?.displayClue), [puzzle?.displayClue]);
  const selectedWordNumber = selectedWord ? wordToNumber.get(selectedWord) ?? null : null;
  const selectedClue = selectedWord ? clueMap.get(selectedWord) || '' : '';
  const selectedWordCells = useMemo(() => {
    if (!selectedWord || !wordPositions[selectedWord]) return new Set();
    return new Set(wordPositions[selectedWord].map((p) => `${p.row},${p.col}`));
  }, [selectedWord, wordPositions]);
  const hintOnlyCells = useMemo(() => {
    const keys = new Set();
    hintLetters.forEach((_, key) => {
      let fromFound = false;
      for (const w of foundWords) {
        if (wordPositions[w]?.some((p) => `${p.row},${p.col}` === key)) {
          fromFound = true;
          break;
        }
      }
      if (!fromFound) keys.add(key);
    });
    return keys;
  }, [hintLetters, foundWords, wordPositions]);
  const puzzleComplete = foundWords.length >= targetWords.length && targetWords.length > 0;
  const selectedWheelWord = selectedIndices.map((i) => wheelTiles[i]?.letter || '').join('');
  const baseLifetimeCoins = wallet.loggedIn ? wallet.lifetimePoints : playSessionCoins;
  const lifetimeCoinsRemaining = Math.max(0, baseLifetimeCoins - hintCoinsSpent);
  const totalHintCoinsAvailable = lifetimeCoinsRemaining + wallet.creditBalance;
  const canUseHint =
    !puzzleComplete
    && hintCandidates.length > 0
    && totalHintCoinsAvailable >= WORD_WHEEL_HINT_COST
    && !hintPending;
  const selectedWordRevealed = Boolean(selectedWord && foundWords.includes(selectedWord));

  useEffect(() => {
    setWheelTiles(buildWheelTiles(baseWheelLetters, puzzle?.id || 'wheel'));
  }, [puzzle?.id, baseWheelLetters]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = isDaily
          ? await WordWheelApi.fetchDaily(dailyDate)
          : await WordWheelApi.fetchNext();
        if (data?.code === 'NO_DATA') {
          setError(isDaily ? 'No daily puzzle available.' : 'No puzzle available.');
          return;
        }
        if (cancelled) return;
        setPuzzle(data);

        if (data?.id) {
          const play = await WordWheelApi.startPlay(data.id);
          if (!cancelled && play && !play.code) {
            setPlaySession(play);
            const saved = (play.wordsFound || '')
              .split('\n')
              .map(normalizeWord)
              .filter(Boolean);
            setFoundWords(saved);
            if (play.totalPuzzleCoins != null) {
              setPlaySessionCoins(Number(play.totalPuzzleCoins) || 0);
            }
          }
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isDaily, dailyDate]);

  const persistProgress = useCallback(
    async (words) => {
      if (!puzzle?.id) return null;
      try {
        const updated = await WordWheelApi.updateProgress(puzzle.id, words);
        if (updated && !updated.code) {
          setPlaySession(updated);
          if (updated.totalPuzzleCoins != null) {
            setPlaySessionCoins(Number(updated.totalPuzzleCoins) || 0);
          }
          return updated;
        }
        return null;
      } catch (e) {
        setError(e?.message || 'Could not save progress');
        return null;
      }
    },
    [puzzle]
  );

  const submitWord = useCallback(
    async (wordRaw) => {
      const word = normalizeWord(wordRaw);
      setSelectedIndices([]);
      if (word.length < 3) return;
      if (!targetWords.includes(word) || foundWords.includes(word)) return;

      const next = [...foundWords, word];
      setFoundWords(next);
      setSelectedWord(word);
      const updatedSession = await persistProgress(next);
      const completeNow = next.length >= targetWords.length;
      if (completeNow && !completionShownRef.current) {
        completionShownRef.current = true;
        const startedAt = updatedSession?.startedAt ?? playSession?.startedAt;
        const finishedAt = updatedSession?.finishedAt ?? Date.now();
        const rawEarned = readCoinsEarned(updatedSession);
        const adjusted = Math.max(0, rawEarned - hintCoinsSpent);
        setCompletionStats({
          durationLabel: formatWordWheelPlayDuration(startedAt, finishedAt),
          coinsEarned: adjusted,
          hintCoinsSpent,
          totalPuzzleCoins: readTotalPuzzleCoinsFromPlay(updatedSession),
          wordCount: targetWords.length,
        });
        setCompletionDialogOpen(true);
        wallet.refresh({ silent: true }).catch(() => {});
      }
    },
    [targetWords, foundWords, persistProgress, playSession, hintCoinsSpent, wallet]
  );

  const handleDragEnd = useCallback(() => {
    const word = selectedIndicesRef.current.map((i) => wheelTilesRef.current[i]?.letter || '').join('');
    if (word.length >= 3) submitWord(word);
  }, [submitWord]);

  const handleCellPress = useCallback(
    (row, col) => {
      const matches = findWordsAtCell(puzzle?.filledCoordinates, row, col, cellWordNumbers);
      if (matches.length > 0) setSelectedWord(matches[0].word);
    },
    [puzzle?.filledCoordinates, cellWordNumbers]
  );

  const handleShuffle = useCallback(() => {
    setWheelTiles((prev) =>
      shuffleWheelTiles(prev.length ? prev : buildWheelTiles(baseWheelLetters, puzzle?.id || 'wheel'))
    );
    setSelectedIndices([]);
  }, [baseWheelLetters, puzzle?.id]);

  const handleHint = useCallback(async () => {
    if (!canUseHint) return;
    const pick = hintCandidates[Math.floor(Math.random() * hintCandidates.length)];
    if (!pick) return;

    setHintPending(true);
    try {
      if (lifetimeCoinsRemaining >= WORD_WHEEL_HINT_COST) {
        setHintCoinsSpent((prev) => prev + WORD_WHEEL_HINT_COST);
      } else if (wallet.creditBalance >= WORD_WHEEL_HINT_COST) {
        await wallet.consumeHintCredits({
          playId: playSession?.id,
          creditsConsumed: WORD_WHEEL_HINT_COST,
        });
      } else {
        return;
      }

      setHintLetters((prev) => {
        const next = new Map(prev);
        next.set(pick.key, pick.letter);
        return next;
      });
      setSelectedWord(pick.word);
    } catch (e) {
      setError(e?.message || 'Could not use hint');
    } finally {
      setHintPending(false);
    }
  }, [
    canUseHint,
    hintCandidates,
    wallet,
    lifetimeCoinsRemaining,
    playSession?.id,
  ]);

  const handleBack = () => {
    if (isDaily) {
      navigate(SCREENS.DAILY, { date: dailyDate });
    } else {
      navigate(SCREENS.HOME);
    }
  };

  if (loading) {
    return (
      <GradientBackground variant="play">
        <View style={styles.centered}>
          <ActivityIndicator color={WW.accent} size="large" />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="play">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={handleBack}>
            <ArrowLeft color={WW.text} size={22} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.kicker}>{isDaily ? 'DAILY PUZZLE' : 'WORD WHEEL QUEST'}</Text>
            {isDaily && puzzle?.dailyDayNumber != null && (
              <Text style={styles.subKicker}>
                Day {puzzle.dailyDayNumber}
                {puzzle.dailyPlayDate ? ` · ${puzzle.dailyPlayDate}` : ''}
              </Text>
            )}
            <Text style={styles.title}>{puzzle?.title || 'Word Wheel Quest'}</Text>
          </View>
          <Pressable
            style={styles.iconBtn}
            onPress={() =>
              navigate(SCREENS.SETTINGS, {
                backScreen: isDaily ? SCREENS.DAILY_PLAY : SCREENS.PLAY,
                mode: routeParams.mode,
                date: routeParams.date,
              })
            }
          >
            <Settings color={WW.text} size={22} />
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PuzzleGrid
          gridSize={gridSize}
          displayGrid={displayGrid}
          puzzleCells={puzzleCells}
          cellWordNumbers={cellWordNumbers}
          selectedWordCells={selectedWordCells}
          hintOnlyCells={hintOnlyCells}
          onCellPress={handleCellPress}
        />

        <View style={[styles.clueBox, selectedWheelWord ? styles.clueBoxActive : null]}>
          <Text style={[styles.clueText, !selectedWord && styles.cluePlaceholder]}>
            {selectedWord
              ? `${selectedWordNumber != null ? `${selectedWordNumber}. ` : ''}${selectedClue || 'No clue available.'}`
              : CLUE_PLACEHOLDER}
          </Text>
          {selectedWheelWord ? (
            <View style={styles.wordOverlay}>
              <Text style={styles.wordOverlayText}>{selectedWheelWord}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.wheelRow}>
          <View style={styles.sideTools}>
            <Pressable
              style={[styles.toolBtn, !canUseHint && styles.toolBtnDisabled]}
              onPress={handleHint}
              disabled={hintPending}
            >
              {hintPending ? (
                <ActivityIndicator color="#2E8B57" size="small" />
              ) : (
                <Lightbulb color="#2E8B57" size={18} />
              )}
            </Pressable>
            <Text
              style={[
                styles.coinLabel,
                totalHintCoinsAvailable < WORD_WHEEL_HINT_COST && styles.coinLabelLow,
              ]}
            >
              {lifetimeCoinsRemaining} coins
            </Text>
          </View>

          <LetterWheel
            tiles={wheelTiles}
            selectedIndices={selectedIndices}
            onSelectionChange={setSelectedIndices}
            onDragEnd={handleDragEnd}
            wheelSize={Math.min(SCREEN_W - 120, 280)}
          />

          <View style={styles.sideTools}>
            <Pressable
              style={[styles.toolBtn, !selectedWord && styles.toolBtnDisabled]}
              onPress={() => setDictionaryOpen(true)}
              disabled={!selectedWord}
            >
              <BookOpen color="#2E8B57" size={18} />
            </Pressable>
            <Pressable style={styles.toolBtn} onPress={handleShuffle}>
              <Shuffle color="#2E8B57" size={18} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <WordWheelDictionarySheet
        visible={dictionaryOpen}
        onClose={() => setDictionaryOpen(false)}
        word={selectedWord || ''}
        wordRevealed={selectedWordRevealed}
        language={puzzle?.language || 'english'}
      />

      <WordWheelCompleteDialog
        visible={completionDialogOpen}
        onClose={() => setCompletionDialogOpen(false)}
        durationLabel={completionStats?.durationLabel}
        coinsEarned={completionStats?.coinsEarned ?? 0}
        hintCoinsSpent={completionStats?.hintCoinsSpent ?? 0}
        totalPuzzleCoins={completionStats?.totalPuzzleCoins}
        wordCount={completionStats?.wordCount}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  kicker: {
    color: 'rgba(236, 253, 245, 0.78)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  subKicker: {
    color: 'rgba(236, 253, 245, 0.78)',
    fontSize: 12,
    marginTop: 2,
  },
  title: {
    color: WW.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  error: {
    color: '#fecaca',
    textAlign: 'center',
    marginBottom: 8,
  },
  clueBox: {
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WW.borderStrong,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  clueBoxActive: {
    minHeight: 60,
  },
  clueText: {
    color: WW.textOnSurface,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  cluePlaceholder: {
    fontStyle: 'italic',
    fontWeight: '500',
    color: 'rgba(15, 61, 54, 0.55)',
  },
  wordOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  wordOverlayText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 4,
    color: WW.textOnSurface,
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  sideTools: {
    width: 44,
    alignItems: 'center',
    gap: 6,
  },
  toolBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: WW.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnDisabled: {
    opacity: 0.5,
  },
  coinLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(15, 61, 54, 0.72)',
    textAlign: 'center',
  },
  coinLabelLow: {
    color: 'rgba(185, 28, 28, 0.85)',
  },
});
