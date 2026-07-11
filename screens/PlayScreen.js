import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, BookOpen, Lightbulb, Shuffle } from 'lucide-react-native';
import LetterWheel from '../components/LetterWheel';
import ClueLetterRow from '../components/ClueLetterRow';
import PuzzleGrid from '../components/PuzzleGrid';
import GradientBackground from '../components/GradientBackground';
import PuzzleLevelToast from '../components/PuzzleLevelToast';
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
  findHintLetterCandidates,
  findWordsAtCell,
  findWordsCompletedByReveal,
  normalizeWord,
  parseWordPositions,
  parseWords,
  puzzleCellKeys,
} from '../lib/gridReveal';
import {
  formatWordWheelPlayDuration,
  WORD_WHEEL_HINT_COST,
} from '../lib/points';
import { buildWheelTiles, lettersForWheel, shuffleWheelTiles } from '../lib/wheelLetters';
import { resolveJourneyLevel } from '../lib/puzzleLevel';
import { formatShortDisplayDate } from '../lib/montrealCalendar';
import { DEFAULT_SEASON } from '../constants/api';
import { PLAY_MODE, SCREENS } from '../constants/theme';
import { useAppearance } from '../context/AppearanceContext';
import { useAudio } from '../context/AudioContext';

const CLUE_PLACEHOLDER = 'Tap a numbered cell to see the clue';
const LEVEL_TOAST_MS = 2200;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
/** Keep wheel + helm handles clear of the home indicator. */
const WHEEL_SIZE = Math.min(SCREEN_W - 120, Math.max(200, SCREEN_H * 0.28), 260);

export default function PlayScreen({ navigate, routeParams = {} }) {
  const isDaily = routeParams.mode === PLAY_MODE.DAILY;
  const dailyDate = routeParams.date;
  const wallet = useWordWheelWallet();
  const { ww } = useAppearance();
  const { playSfx } = useAudio();

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
  const [levelToastVisible, setLevelToastVisible] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [celebratingCellKeys, setCelebratingCellKeys] = useState(() => new Set());
  const [celebrateOrder, setCelebrateOrder] = useState([]);
  const [celebrateMode, setCelebrateMode] = useState('new');
  const [revealBurstId, setRevealBurstId] = useState(0);
  const completionShownRef = useRef(false);
  const completedPuzzleIdRef = useRef(null);
  const completedLevelRef = useRef(null);
  const completedSeasonRef = useRef(null);

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
    () =>
      findHintLetterCandidates(
        puzzle?.filledCoordinates,
        foundWords,
        wordPositions,
        hintedCellKeys
      ),
    [puzzle?.filledCoordinates, foundWords, wordPositions, hintedCellKeys]
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
  const lifetimeCoinsRemaining = wallet.loggedIn
    ? Math.max(0, wallet.lifetimePoints)
    : Math.max(0, playSessionCoins - hintCoinsSpent);
  const totalHintCoinsAvailable = lifetimeCoinsRemaining + wallet.creditBalance;
  const canUseHint =
    !puzzleComplete
    && hintCandidates.length > 0
    && totalHintCoinsAvailable >= WORD_WHEEL_HINT_COST
    && !hintPending;

  useEffect(() => {
    if (!__DEV__ || loading) return;
    console.log('[Hint]', {
      canUseHint,
      coins: totalHintCoinsAvailable,
      lifetimeCoinsRemaining,
      creditBalance: wallet.creditBalance,
      loggedIn: wallet.loggedIn,
      candidates: hintCandidates.length,
      puzzleComplete,
      hintPending,
      cost: WORD_WHEEL_HINT_COST,
    });
  }, [
    loading,
    canUseHint,
    totalHintCoinsAvailable,
    lifetimeCoinsRemaining,
    wallet.creditBalance,
    wallet.loggedIn,
    hintCandidates.length,
    puzzleComplete,
    hintPending,
  ]);
  const selectedWordRevealed = Boolean(selectedWord && foundWords.includes(selectedWord));
  const journeyLevel = useMemo(() => resolveJourneyLevel(puzzle), [puzzle]);
  const dailyLabel = useMemo(() => {
    if (!isDaily) return '';
    return formatShortDisplayDate(dailyDate || puzzle?.dailyPlayDate) || 'Daily';
  }, [isDaily, dailyDate, puzzle?.dailyPlayDate]);

  useEffect(() => {
    setWheelTiles(buildWheelTiles(baseWheelLetters, puzzle?.id || 'wheel'));
  }, [puzzle?.id, baseWheelLetters]);

  useEffect(() => {
    if (loading || !puzzle) return undefined;
    setLevelToastVisible(true);
    const timer = setTimeout(() => setLevelToastVisible(false), LEVEL_TOAST_MS);
    return () => clearTimeout(timer);
  }, [loading, puzzle?.id, isDaily, dailyDate, reloadKey]);

  const resetPlayState = useCallback(() => {
    setFoundWords([]);
    setSelectedIndices([]);
    setPlaySession(null);
    setSelectedWord(null);
    setHintLetters(new Map());
    setHintCoinsSpent(0);
    setHintPending(false);
    setDictionaryOpen(false);
    setCompletionDialogOpen(false);
    setCompletionStats(null);
    setCelebratingCellKeys(new Set());
    setCelebrateOrder([]);
    setCelebrateMode('new');
    completionShownRef.current = false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      resetPlayState();
      try {
        let data = isDaily
          ? await WordWheelApi.fetchDaily(dailyDate)
          : await WordWheelApi.fetchNext();

        if (!isDaily) {
          const completedId = completedPuzzleIdRef.current;
          const needsFallback =
            !data?.id
            || data?.code === 'FAILURE'
            || (completedId && data.id === completedId);

          if (needsFallback) {
            const baseLevel =
              completedLevelRef.current
              ?? resolveJourneyLevel(data)
              ?? Number(data?.puzzleLevel)
              ?? 1;
            const season = completedSeasonRef.current || data?.season || DEFAULT_SEASON;
            if (__DEV__) {
              console.log('[Play] next fallback from level', baseLevel, {
                code: data?.code,
                id: data?.id,
                completedId,
              });
            }
            for (let level = baseLevel + 1; level <= baseLevel + 5; level += 1) {
              const fallback = await WordWheelApi.fetchJourneyLevel(level, season);
              if (fallback?.id && fallback.code !== 'FAILURE' && fallback.id !== completedId) {
                data = fallback;
                break;
              }
            }
          }
        }

        if (data?.code === 'NO_DATA') {
          if (!cancelled) {
            setPuzzle(null);
            setError(isDaily ? 'No daily puzzle available.' : 'No puzzle available.');
          }
          return;
        }
        if (data?.code === 'FAILURE' || !data?.id) {
          if (!cancelled) {
            setPuzzle(null);
            setError(data?.message || 'Could not load puzzle.');
          }
          return;
        }
        if (cancelled) return;

        completedPuzzleIdRef.current = null;
        completedLevelRef.current = null;
        completedSeasonRef.current = null;
        setPuzzle(data);

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
      } catch (e) {
        if (!cancelled) {
          setPuzzle(null);
          setError(e?.message || 'Failed to load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isDaily, dailyDate, reloadKey, resetPlayState]);

  const handleNextPuzzle = useCallback(() => {
    if (isDaily) {
      setCompletionDialogOpen(false);
      navigate(SCREENS.DAILY, { date: dailyDate });
      return;
    }
    completedPuzzleIdRef.current = puzzle?.id || null;
    completedLevelRef.current = resolveJourneyLevel(puzzle) ?? Number(puzzle?.puzzleLevel) ?? null;
    completedSeasonRef.current = puzzle?.season || DEFAULT_SEASON;
    setCompletionDialogOpen(false);
    setReloadKey((k) => k + 1);
  }, [isDaily, dailyDate, navigate, puzzle]);

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

  const triggerCellRevealEffect = useCallback((keys, mode = 'new') => {
    const cellKeys = (keys || []).filter(Boolean);
    if (!cellKeys.length) return;
    setCelebrateMode(mode);
    setCelebrateOrder(cellKeys);
    setCelebratingCellKeys(new Set(cellKeys));
    setRevealBurstId((id) => id + 1);
    setTimeout(() => {
      setCelebratingCellKeys(new Set());
      setCelebrateOrder([]);
      setCelebrateMode('new');
    }, mode === 'already' ? 900 : 1100);
  }, []);

  const triggerWordRevealEffect = useCallback(
    (word, mode = 'new') => {
      const positions = wordPositions[normalizeWord(word)];
      if (!positions?.length) return;
      triggerCellRevealEffect(
        positions.map((p) => `${p.row},${p.col}`),
        mode
      );
    },
    [wordPositions, triggerCellRevealEffect]
  );

  const openCompletionIfNeeded = useCallback(
    async (words, updatedSession) => {
      const completeNow = words.length >= targetWords.length && targetWords.length > 0;
      if (!completeNow || completionShownRef.current) return;
      completionShownRef.current = true;
      playSfx('complete');
      const startedAt = updatedSession?.startedAt ?? playSession?.startedAt;
      const finishedAt = updatedSession?.finishedAt ?? Date.now();
      setCompletionStats({
        durationLabel: formatWordWheelPlayDuration(startedAt, finishedAt),
        hintCoinsSpent,
      });
      setTimeout(() => setCompletionDialogOpen(true), 900);
      wallet.refresh({ silent: true }).catch(() => {});
    },
    [targetWords.length, playSession, hintCoinsSpent, wallet, playSfx]
  );

  const submitWord = useCallback(
    async (wordRaw) => {
      const word = normalizeWord(wordRaw);
      if (word.length < 3) return false;
      if (!targetWords.includes(word)) {
        playSfx('wrong');
        return false;
      }

      // Already revealed — pulse the cells so the player knows.
      if (foundWords.includes(word)) {
        playSfx('chime');
        setSelectedWord(word);
        triggerWordRevealEffect(word, 'already');
        return true;
      }

      playSfx('correct');
      const next = [...foundWords, word];
      setFoundWords(next);
      setSelectedWord(word);
      triggerWordRevealEffect(word, 'new');
      const updatedSession = await persistProgress(next);
      await openCompletionIfNeeded(next, updatedSession);
      return true;
    },
    [
      targetWords,
      foundWords,
      persistProgress,
      triggerWordRevealEffect,
      openCompletionIfNeeded,
      playSfx,
    ]
  );

  const handleDragEnd = useCallback(
    (word) => {
      if (word.length >= 3) submitWord(word);
      else if (word.length > 0) playSfx('wrong');
    },
    [submitWord, playSfx]
  );

  const handleCellPress = useCallback(
    (row, col) => {
      setSelectedIndices([]);
      const matches = findWordsAtCell(puzzle?.filledCoordinates, row, col, cellWordNumbers);
      if (matches.length > 0) setSelectedWord(matches[0].word);
    },
    [puzzle?.filledCoordinates, cellWordNumbers]
  );

  const handleShuffle = useCallback(() => {
    playSfx('whoosh');
    setWheelTiles((prev) =>
      shuffleWheelTiles(prev.length ? prev : buildWheelTiles(baseWheelLetters, puzzle?.id || 'wheel'))
    );
    setSelectedIndices([]);
  }, [baseWheelLetters, puzzle?.id, playSfx]);

  const handleHint = useCallback(async () => {
    if (puzzleComplete) return;
    if (hintPending) return;

    if (totalHintCoinsAvailable < WORD_WHEEL_HINT_COST) {
      Alert.alert('Not enough coins', `Hints cost ${WORD_WHEEL_HINT_COST} coin each.`);
      return;
    }

    const pick = hintCandidates[0];
    if (!pick) {
      Alert.alert('No hint available', 'Every remaining letter is already visible on the grid.');
      return;
    }

    setHintPending(true);
    try {
      if (lifetimeCoinsRemaining >= WORD_WHEEL_HINT_COST) {
        setHintCoinsSpent((prev) => prev + WORD_WHEEL_HINT_COST);
        if (wallet.loggedIn) {
          wallet.spendLifetimePoints?.(WORD_WHEEL_HINT_COST);
        }
      } else if (wallet.creditBalance >= WORD_WHEEL_HINT_COST) {
        await wallet.consumeHintCredits({
          playId: playSession?.id,
          creditsConsumed: WORD_WHEEL_HINT_COST,
        });
      } else {
        Alert.alert('Not enough coins', `Hints cost ${WORD_WHEEL_HINT_COST} coin each.`);
        return;
      }

      playSfx('bonus');
      const nextHints = new Map(hintLetters);
      nextHints.set(pick.key, pick.letter);
      setHintLetters(nextHints);
      setSelectedWord(pick.word);
      triggerCellRevealEffect([pick.key], 'new');

      // If hints (plus crossings) fully reveal a word, count it as found.
      const newlyCompleted = findWordsCompletedByReveal(foundWords, wordPositions, nextHints);
      if (newlyCompleted.length > 0) {
        const nextFound = [...foundWords];
        newlyCompleted.forEach((word) => {
          if (!nextFound.includes(word)) nextFound.push(word);
        });
        setFoundWords(nextFound);
        newlyCompleted.forEach((word) => {
          playSfx('correct');
          triggerWordRevealEffect(word, 'new');
        });
        const updatedSession = await persistProgress(nextFound);
        await openCompletionIfNeeded(nextFound, updatedSession);
      }
    } catch (e) {
      setError(e?.message || 'Could not use hint');
    } finally {
      setHintPending(false);
    }
  }, [
    puzzleComplete,
    hintPending,
    totalHintCoinsAvailable,
    hintCandidates,
    lifetimeCoinsRemaining,
    wallet,
    playSession?.id,
    triggerCellRevealEffect,
    hintLetters,
    foundWords,
    wordPositions,
    triggerWordRevealEffect,
    persistProgress,
    openCompletionIfNeeded,
    playSfx,
  ]);

  const handleBack = () => {
    playSfx('click');
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
          <ActivityIndicator color={ww.accent} size="large" />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="play">
      <PuzzleLevelToast
        visible={levelToastVisible && !loading && Boolean(puzzle)}
        isDaily={isDaily}
        level={journeyLevel}
        dailyLabel={dailyLabel}
        title={puzzle?.title}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={handleBack}>
            <ArrowLeft color={ww.text} size={22} />
          </Pressable>
          <View style={styles.headerCenter}>
            {isDaily ? (
              <Text style={[styles.levelHero, { color: ww.text }]}>{dailyLabel}</Text>
            ) : (
              <Text style={[styles.levelHero, { color: ww.text }]}>
                {journeyLevel != null ? `Level ${journeyLevel}` : 'Level'}
              </Text>
            )}
            <Text style={[styles.title, { color: ww.textSecondary }]} numberOfLines={2}>
              {puzzle?.title || 'Word Wheel Quest'}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PuzzleGrid
          gridSize={gridSize}
          displayGrid={displayGrid}
          puzzleCells={puzzleCells}
          cellWordNumbers={cellWordNumbers}
          selectedWordCells={selectedWordCells}
          hintOnlyCells={hintOnlyCells}
          celebratingCellKeys={celebratingCellKeys}
          celebrateOrder={celebrateOrder}
          celebrateMode={celebrateMode}
          revealBurstId={revealBurstId}
          onCellPress={handleCellPress}
        />

        <View
          style={[
            styles.clueBox,
            { backgroundColor: ww.clueBg, borderColor: ww.borderStrong },
            selectedWheelWord ? styles.clueBoxActive : null,
          ]}
        >
          <Text
            style={[
              styles.clueText,
              { color: ww.textOnSurface },
              !selectedWord && styles.cluePlaceholder,
            ]}
          >
            {selectedWord
              ? `${selectedWordNumber != null ? `${selectedWordNumber}. ` : ''}${selectedClue || 'No clue available.'}`
              : CLUE_PLACEHOLDER}
          </Text>
          {selectedWheelWord ? (
            <View style={styles.wordOverlay}>
              <ClueLetterRow word={selectedWheelWord} />
            </View>
          ) : null}
        </View>

        <View style={styles.wheelRow}>
          <View style={styles.sideTools}>
            <Pressable
              style={[
                styles.toolBtn,
                { backgroundColor: ww.toolBtnBg, borderColor: ww.borderStrong },
                !canUseHint && styles.toolBtnDisabled,
              ]}
              onPress={handleHint}
              disabled={hintPending}
              accessibilityLabel="Use hint"
            >
              {hintPending ? (
                <ActivityIndicator color={ww.toolIcon} size="small" />
              ) : (
                <Lightbulb color={ww.toolIcon} size={18} />
              )}
            </Pressable>
            <Text
              style={[
                styles.coinLabel,
                { color: ww.coinLabel },
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
            wheelSize={WHEEL_SIZE}
          />

          <View style={styles.sideTools}>
            <Pressable
              style={[
                styles.toolBtn,
                { backgroundColor: ww.toolBtnBg, borderColor: ww.borderStrong },
                !selectedWord && styles.toolBtnDisabled,
              ]}
              onPress={() => setDictionaryOpen(true)}
              disabled={!selectedWord}
            >
              <BookOpen color={ww.toolIcon} size={18} />
            </Pressable>
            <Pressable
              style={[styles.toolBtn, { backgroundColor: ww.toolBtnBg, borderColor: ww.borderStrong }]}
              onPress={handleShuffle}
            >
              <Shuffle color={ww.toolIcon} size={18} />
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
        onNext={handleNextPuzzle}
        durationLabel={completionStats?.durationLabel}
        hintCoinsSpent={completionStats?.hintCoinsSpent ?? 0}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 48,
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
  levelHero: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  error: {
    color: '#fecaca',
    textAlign: 'center',
    marginBottom: 8,
  },
  clueBox: {
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
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
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnDisabled: {
    opacity: 0.5,
  },
  coinLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  coinLabelLow: {
    color: '#fecaca',
  },
});
