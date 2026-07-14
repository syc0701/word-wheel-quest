import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ArrowLeft, BookOpen, ChevronRight, Clock, Lightbulb, Tornado } from 'lucide-react-native';
import { GiTwoCoins } from '../components/GiTwoCoins';
import { PiTreasureChest } from '../components/PiTreasureChest';
import LetterWheel from '../components/LetterWheel';
import ClueLetterRow from '../components/ClueLetterRow';
import SwipeableClueStrip from '../components/SwipeableClueStrip';
import PuzzleGrid from '../components/PuzzleGrid';
import GradientBackground from '../components/GradientBackground';
import WordWheelCompleteDialog from '../components/WordWheelCompleteDialog';
import WordWheelDictionarySheet from '../components/WordWheelDictionarySheet';
import BonusWordModal from '../components/BonusWordModal';
import TreasureBonusWordsModal from '../components/TreasureBonusWordsModal';
import { CoinSparkBurst } from '../effect';
import useWordWheelWallet from '../hooks/useWordWheelWallet';
import WordWheelApi from '../lib/api';
import { validateBonusWord } from '../lib/dictionary';
import { resolveWordWheelGridSize } from '../lib/constants';
import {
  buildCellWordNumbers,
  buildClueMapFromDisplayClue,
  buildDisplayGrid,
  buildWordToNumberMap,
  findHintLetterCandidates,
  findWordsAtCell,
  findWordsCompletedByReveal,
  listUnfoundClueEntries,
  normalizeWord,
  parseWordPositions,
  parseWords,
  puzzleCellKeys,
} from '../lib/gridReveal';
import {
  loadStoredBonusWords,
  mergeBonusWordLists,
  parseBonusWordsFromPlay,
  saveStoredBonusWords,
} from '../lib/bonusWordsStorage';
import {
  formatWordWheelPlayDuration,
  parseWordWheelCatalog,
  readCoinsEarned,
  sumWordWheelCoinsForWords,
  WORD_WHEEL_HINT_COST,
  WORD_WHEEL_BONUS_WORD_GIFT,
} from '../lib/points';
import { buildWheelTiles, lettersForWheel, shuffleWheelTiles } from '../lib/wheelLetters';
import { resolveJourneyLevel } from '../lib/puzzleLevel';
import { LevelScreenPolicy } from '../lib/LevelScreenPolicy';
import { formatShortDisplayDate } from '../lib/montrealCalendar';
import { DEFAULT_SEASON } from '../constants/api';
import { PLAY_MODE, SCREENS } from '../constants/theme';
import { useAppearance } from '../context/AppearanceContext';
import { useAudio } from '../context/AudioContext';
import { usePlayTimer } from '../context/PlayTimerContext';
import { useT } from '../context/LanguageContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
/** Keep wheel clear of the home indicator. */
const WHEEL_SIZE = Math.min(SCREEN_W - 120, Math.max(200, SCREEN_H * 0.28), 260);

export default function PlayScreen({ navigate, routeParams = {} }) {
  const isDaily = routeParams.mode === PLAY_MODE.DAILY;
  const dailyDate = routeParams.date;
  const wallet = useWordWheelWallet();
  const { ww, isRandomScene } = useAppearance();
  const { playSfx } = useAudio();
  const { timerEnabled } = usePlayTimer();
  const t = useT();

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
  const [dictionaryWord, setDictionaryWord] = useState('');
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [completionStats, setCompletionStats] = useState(null);
  const [showHeaderNext, setShowHeaderNext] = useState(false);
  const [bonusWordModal, setBonusWordModal] = useState({
    visible: false,
    word: '',
    awardedGift: false,
    pendingGift: 0,
  });
  const coinPulse = useRef(new Animated.Value(1)).current;
  const [coinSparkBurstId, setCoinSparkBurstId] = useState(0);
  const [coinSparkVisible, setCoinSparkVisible] = useState(false);
  const coinSparkClearRef = useRef(null);
  const [bonusWordsFound, setBonusWordsFound] = useState([]);
  const [treasureOpen, setTreasureOpen] = useState(false);
  const [shuffleSignal, setShuffleSignal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [coinsCatalog, setCoinsCatalog] = useState([]);
  const [celebratingCellKeys, setCelebratingCellKeys] = useState(() => new Set());
  const [celebrateOrder, setCelebrateOrder] = useState([]);
  const [celebrateMode, setCelebrateMode] = useState('new');
  const [revealBurstId, setRevealBurstId] = useState(0);
  const completionShownRef = useRef(false);
  const levelStartedAtRef = useRef(null);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [elapsedLabel, setElapsedLabel] = useState('0:00');
  const bonusWordLookupRef = useRef(false);
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
  const cellWordNumbers = useMemo(
    () =>
      buildCellWordNumbers(
        puzzle?.filledCoordinates,
        foundWords,
        wordPositions,
        hintedCellKeys,
        displayGrid
      ),
    [puzzle?.filledCoordinates, foundWords, wordPositions, hintedCellKeys, displayGrid]
  );
  const wordToNumber = useMemo(
    () => buildWordToNumberMap(puzzle?.filledCoordinates, cellWordNumbers),
    [puzzle?.filledCoordinates, cellWordNumbers]
  );
  const clueMap = useMemo(() => buildClueMapFromDisplayClue(puzzle?.displayClue), [puzzle?.displayClue]);
  const unfoundClues = useMemo(
    () =>
      listUnfoundClueEntries(
        puzzle?.filledCoordinates,
        puzzle?.displayClue,
        foundWords,
        wordPositions,
        hintedCellKeys,
        displayGrid
      ),
    [puzzle?.filledCoordinates, puzzle?.displayClue, foundWords, wordPositions, hintedCellKeys, displayGrid]
  );

  // Keep clue strip on an unsolved word; default to the first remaining clue.
  useEffect(() => {
    if (unfoundClues.length === 0) {
      if (selectedWord && foundWords.includes(normalizeWord(selectedWord))) {
        setSelectedWord(null);
      }
      return;
    }
    const normalizedSelected = selectedWord ? normalizeWord(selectedWord) : '';
    const stillOpen = unfoundClues.some((entry) => entry.word === normalizedSelected);
    if (!stillOpen) {
      setSelectedWord(unfoundClues[0].word);
    }
  }, [unfoundClues, selectedWord, foundWords]);

  const clueIndex = useMemo(() => {
    if (!selectedWord) return 0;
    const idx = unfoundClues.findIndex((entry) => entry.word === normalizeWord(selectedWord));
    return idx >= 0 ? idx : 0;
  }, [unfoundClues, selectedWord]);

  const activeClue = unfoundClues[clueIndex] || null;

  // Prefer hint letters in the currently selected/clued word.
  const hintPreferredWord = normalizeWord(selectedWord || activeClue?.word || '');
  const hintCandidates = useMemo(
    () =>
      findHintLetterCandidates(
        puzzle?.filledCoordinates,
        foundWords,
        wordPositions,
        hintedCellKeys,
        hintPreferredWord
      ),
    [puzzle?.filledCoordinates, foundWords, wordPositions, hintedCellKeys, hintPreferredWord]
  );
  const selectedWordNumber = activeClue?.number
    ?? (selectedWord ? wordToNumber.get(normalizeWord(selectedWord)) ?? null : null);
  const selectedClue = activeClue
    ? (activeClue.clue || '')
    : (selectedWord ? clueMap.get(normalizeWord(selectedWord)) || '' : '');
  const selectedWordCells = useMemo(() => {
    // Prefer the word the player just picked/found; fall back to the clue strip word.
    const word = selectedWord || activeClue?.word;
    if (!word || !wordPositions[normalizeWord(word)]) return new Set();
    return new Set(wordPositions[normalizeWord(word)].map((p) => `${p.row},${p.col}`));
  }, [activeClue, selectedWord, wordPositions]);

  const goClue = useCallback(
    (delta) => {
      if (unfoundClues.length === 0) return;
      const next = (clueIndex + delta + unfoundClues.length) % unfoundClues.length;
      setSelectedWord(unfoundClues[next].word);
    },
    [unfoundClues, clueIndex]
  );

  const clueStripText = activeClue
    ? `${activeClue.number != null ? `${activeClue.number}. ` : ''}${activeClue.clue || t('play.clue.missing')}`
    : selectedWord
      ? `${selectedWordNumber != null ? `${selectedWordNumber}. ` : ''}${selectedClue || t('play.clue.missing')}`
      : t('play.clue.placeholder');
  const clueStripPlaceholder = !activeClue && !selectedWord;

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

  useEffect(() => {
    if (!timerEnabled || !timerStartedAt) {
      setElapsedLabel('0:00');
      return undefined;
    }
    const tick = () => {
      setElapsedLabel(formatWordWheelPlayDuration(timerStartedAt, Date.now()));
    };
    tick();
    if (puzzleComplete) return undefined;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerEnabled, timerStartedAt, puzzleComplete]);

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
  const dictionaryWordRevealed = Boolean(
    dictionaryWord
    && (
      foundWords.includes(normalizeWord(dictionaryWord))
      || bonusWordsFound.includes(normalizeWord(dictionaryWord))
    )
  );
  const journeyLevel = useMemo(() => resolveJourneyLevel(puzzle), [puzzle]);
  const dailyLabel = useMemo(() => {
    if (!isDaily) return '';
    return formatShortDisplayDate(dailyDate || puzzle?.dailyPlayDate) || t('toast.dailyFallback');
  }, [isDaily, dailyDate, puzzle?.dailyPlayDate, t]);

  useEffect(() => {
    setWheelTiles(buildWheelTiles(baseWheelLetters, puzzle?.id || 'wheel'));
  }, [puzzle?.id, baseWheelLetters]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const catalog = await WordWheelApi.fetchCoinsCatalog();
        if (!cancelled) {
          setCoinsCatalog(parseWordWheelCatalog(catalog));
        }
      } catch {
        if (!cancelled) setCoinsCatalog([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetPlayState = useCallback(() => {
    setFoundWords([]);
    setSelectedIndices([]);
    setPlaySession(null);
    setSelectedWord(null);
    setHintLetters(new Map());
    setHintCoinsSpent(0);
    setHintPending(false);
    setDictionaryOpen(false);
    setDictionaryWord('');
    setCompletionDialogOpen(false);
    setCompletionStats(null);
    setShowHeaderNext(false);
    setCelebratingCellKeys(new Set());
    setCelebrateOrder([]);
    setCelebrateMode('new');
    completionShownRef.current = false;
    levelStartedAtRef.current = null;
    setTimerStartedAt(null);
    setElapsedLabel('0:00');
    bonusWordLookupRef.current = false;
    setBonusWordModal({ visible: false, word: '', awardedGift: false, pendingGift: 0 });
    setBonusWordsFound([]);
    setTreasureOpen(false);
  }, []);

  const pulseCoinBalance = useCallback(() => {
    coinPulse.stopAnimation();
    coinPulse.setValue(1);
    Animated.sequence([
      Animated.spring(coinPulse, {
        toValue: 1.45,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.spring(coinPulse, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();

    if (coinSparkClearRef.current) clearTimeout(coinSparkClearRef.current);
    setCoinSparkVisible(true);
    setCoinSparkBurstId((id) => id + 1);
    coinSparkClearRef.current = setTimeout(() => {
      setCoinSparkVisible(false);
      coinSparkClearRef.current = null;
    }, 900);
  }, [coinPulse]);

  const applyBonusWordGift = useCallback(
    (amount) => {
      const gift = Math.max(0, Number(amount) || 0);
      if (!gift) return;
      if (wallet.loggedIn) {
        wallet.addLifetimePoints?.(gift);
      } else {
        setPlaySessionCoins((prev) => prev + gift);
      }
      playSfx('bonus');
      // Let the new total paint, then pulse icon + number.
      requestAnimationFrame(() => pulseCoinBalance());
    },
    [wallet, playSfx, pulseCoinBalance]
  );

  const handleBonusWordClose = useCallback(() => {
    const gift = bonusWordModal.awardedGift ? bonusWordModal.pendingGift : 0;
    setBonusWordModal({ visible: false, word: '', awardedGift: false, pendingGift: 0 });
    if (gift > 0) {
      // Award after the modal uncovers the coin row so 3 → 4 is visible.
      setTimeout(() => applyBonusWordGift(gift), 80);
    }
  }, [bonusWordModal.awardedGift, bonusWordModal.pendingGift, applyBonusWordGift]);

  useEffect(() => () => {
    if (coinSparkClearRef.current) clearTimeout(coinSparkClearRef.current);
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
            setError(isDaily ? t('play.error.noDaily') : t('play.error.noPuzzle'));
          }
          return;
        }
        if (data?.code === 'FAILURE' || !data?.id) {
          if (!cancelled) {
            setPuzzle(null);
            setError(data?.message || t('play.error.loadFailed'));
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
          const startedAt = Date.now();
          levelStartedAtRef.current = startedAt;
          setTimerStartedAt(startedAt);
          const saved = (play.wordsFound || '')
            .split('\n')
            .map(normalizeWord)
            .filter(Boolean);
          setFoundWords(saved);
          const fromServer = parseBonusWordsFromPlay(play);
          const fromLocal = await loadStoredBonusWords(data.id);
          const bonus = mergeBonusWordLists(fromServer, fromLocal);
          setBonusWordsFound(bonus);
          if (bonus.length) {
            await saveStoredBonusWords(data.id, bonus);
            if (fromLocal.length > fromServer.length) {
              // Push local-only finds up to the server when the API supports it.
              WordWheelApi.updateProgress(data.id, saved, bonus).catch(() => {});
            }
          }
          const baseCoins = Number(play.totalPuzzleCoins) || 0;
          // Guest puzzle-coin balance isn’t on the server for bonus gifts — restore +1 per saved find.
          const restoredBonusCoins = bonus.length * WORD_WHEEL_BONUS_WORD_GIFT;
          setPlaySessionCoins(baseCoins + restoredBonusCoins);
        } else if (!cancelled) {
          // Still time the attempt even if play session start fails.
          const startedAt = Date.now();
          levelStartedAtRef.current = startedAt;
          setTimerStartedAt(startedAt);
          const fromLocal = await loadStoredBonusWords(data.id);
          if (fromLocal.length) setBonusWordsFound(fromLocal);
        }
      } catch (e) {
        if (!cancelled) {
          setPuzzle(null);
          setError(e?.message || t('play.error.generic'));
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
      setShowHeaderNext(false);
      navigate(SCREENS.DAILY, { date: dailyDate });
      return;
    }
    completedPuzzleIdRef.current = puzzle?.id || null;
    completedLevelRef.current = resolveJourneyLevel(puzzle) ?? Number(puzzle?.puzzleLevel) ?? null;
    completedSeasonRef.current = puzzle?.season || DEFAULT_SEASON;
    setCompletionDialogOpen(false);
    setShowHeaderNext(false);
    setReloadKey((k) => k + 1);
  }, [isDaily, dailyDate, navigate, puzzle]);

  const handleCloseCompletionDialog = useCallback(() => {
    setCompletionDialogOpen(false);
    setShowHeaderNext(true);
  }, []);

  const persistProgress = useCallback(
    async (words, bonusWords = bonusWordsFound) => {
      if (!puzzle?.id) return null;
      try {
        const updated = await WordWheelApi.updateProgress(puzzle.id, words, bonusWords);
        if (updated && !updated.code) {
          setPlaySession(updated);
          if (updated.totalPuzzleCoins != null) {
            setPlaySessionCoins(Number(updated.totalPuzzleCoins) || 0);
          }
          return updated;
        }
        return null;
      } catch (e) {
        setError(e?.message || t('play.error.saveFailed'));
        return null;
      }
    },
    [puzzle, t, bonusWordsFound]
  );

  const persistBonusWords = useCallback(
    async (words) => {
      if (!puzzle?.id) return;
      await saveStoredBonusWords(puzzle.id, words);
      try {
        await WordWheelApi.updateProgress(puzzle.id, foundWords, words);
      } catch {
        // Local cache already saved; server sync is best-effort.
      }
    },
    [puzzle?.id, foundWords]
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
      const startedAt = levelStartedAtRef.current ?? Date.now();
      const finishedAt = Date.now();
      const levelNumber = isDaily
        ? null
        : (resolveJourneyLevel(puzzle) ?? Number(puzzle?.puzzleLevel) ?? null);
      const screenType = LevelScreenPolicy.determineScreenType({ levelNumber });
      const milestoneBonus = LevelScreenPolicy.resolveBonusCoins(levelNumber);
      const fromServer = readCoinsEarned(updatedSession);
      const localBase = sumWordWheelCoinsForWords(words, coinsCatalog);
      // Server award already includes milestone bonus; local/guest path adds it here.
      const scoreCoins =
        fromServer > 0 ? fromServer : localBase + milestoneBonus;
      setCompletionStats({
        durationLabel: formatWordWheelPlayDuration(startedAt, finishedAt),
        hintCoinsSpent,
        scoreCoins,
        levelNumber,
        screenType,
        milestoneBonus,
      });
      setTimeout(() => setCompletionDialogOpen(true), 900);
      wallet.refresh({ silent: true }).catch(() => {});
    },
    [targetWords.length, hintCoinsSpent, wallet, playSfx, coinsCatalog, isDaily, puzzle]
  );

  // Crossings / hints can finish a word without a wheel submit — promote those to found.
  useEffect(() => {
    if (!puzzle?.id || !wordPositions || Object.keys(wordPositions).length === 0) return;
    const newly = findWordsCompletedByReveal(foundWords, wordPositions, hintedCellKeys);
    if (!newly.length) return;
    const next = [...foundWords];
    newly.forEach((w) => {
      if (!next.includes(w)) next.push(w);
    });
    if (next.length === foundWords.length) return;
    setFoundWords(next);
    newly.forEach((w) => {
      playSfx('correct');
      triggerWordRevealEffect(w, 'new');
    });
    persistProgress(next).then((updatedSession) => {
      openCompletionIfNeeded(next, updatedSession);
    });
  }, [
    puzzle?.id,
    foundWords,
    wordPositions,
    hintedCellKeys,
    persistProgress,
    openCompletionIfNeeded,
    playSfx,
    triggerWordRevealEffect,
  ]);

  const submitWord = useCallback(
    async (wordRaw) => {
      const word = normalizeWord(wordRaw);
      if (word.length < 3) return false;

      if (!targetWords.includes(word)) {
        if (bonusWordLookupRef.current) return false;
        // Same bonus word again — no second gift.
        if (bonusWordsFound.includes(word)) {
          playSfx('wrong');
          return false;
        }
        bonusWordLookupRef.current = true;
        try {
          const language = puzzle?.language || 'english';
          const check = await validateBonusWord(word, language);
          if (!check.ok) {
            playSfx('wrong');
            return false;
          }

          setBonusWordsFound((prev) => {
            const next = prev.includes(word) ? prev : [...prev, word];
            persistBonusWords(next);
            return next;
          });
          playSfx('chime');
          // Gift applies when the modal closes so the coin row can animate 3 → 4.
          setBonusWordModal({
            visible: true,
            word,
            awardedGift: true,
            pendingGift: WORD_WHEEL_BONUS_WORD_GIFT,
          });
          return true;
        } finally {
          bonusWordLookupRef.current = false;
        }
      }

      // Already revealed — pulse the cells so the player knows.
      if (foundWords.includes(word)) {
        playSfx('chime');
        setSelectedWord(word);
        triggerWordRevealEffect(word, 'already');
        return true;
      }

      playSfx('correct');
      let next = [...foundWords, word];
      // Crossings can finish other words — treat them as found too.
      const cascaded = findWordsCompletedByReveal(next, wordPositions, hintedCellKeys);
      cascaded.forEach((w) => {
        if (!next.includes(w)) next.push(w);
      });
      setFoundWords(next);
      setSelectedWord(word);
      triggerWordRevealEffect(word, 'new');
      cascaded.forEach((w) => {
        if (w !== word) triggerWordRevealEffect(w, 'new');
      });
      const updatedSession = await persistProgress(next);
      await openCompletionIfNeeded(next, updatedSession);
      return true;
    },
    [
      targetWords,
      foundWords,
      wordPositions,
      hintedCellKeys,
      persistProgress,
      triggerWordRevealEffect,
      openCompletionIfNeeded,
      playSfx,
      puzzle?.language,
      wallet,
      bonusWordsFound,
      persistBonusWords,
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
      const open = matches.find((m) => !foundWords.includes(m.word));
      if (open) setSelectedWord(open.word);
      else if (matches.length > 0) setSelectedWord(matches[0].word);
    },
    [puzzle?.filledCoordinates, cellWordNumbers, foundWords]
  );

  const handleShuffle = useCallback(() => {
    playSfx('whoosh');
    setSelectedIndices([]);
    setShuffleSignal((n) => n + 1);
  }, [playSfx]);

  const applyWheelShuffle = useCallback(() => {
    setWheelTiles((prev) =>
      shuffleWheelTiles(prev.length ? prev : buildWheelTiles(baseWheelLetters, puzzle?.id || 'wheel'))
    );
  }, [baseWheelLetters, puzzle?.id]);

  const showNotEnoughCoinsAlert = useCallback(() => {
    Alert.alert(
      t('play.alert.notEnoughCoins.title'),
      t('play.alert.notEnoughCoins.body', { n: WORD_WHEEL_HINT_COST }),
      [
        { text: t('play.alert.notEnoughCoins.ok'), style: 'cancel' },
        {
          text: t('play.alert.notEnoughCoins.charge'),
          onPress: () =>
            navigate(SCREENS.SHOP, {
              backScreen: isDaily ? SCREENS.DAILY_PLAY : SCREENS.PLAY,
              mode: routeParams.mode,
              date: routeParams.date,
            }),
        },
      ]
    );
  }, [t, navigate, isDaily, routeParams.mode, routeParams.date]);

  const handleHint = useCallback(async () => {
    if (puzzleComplete) return;
    if (hintPending) return;

    if (totalHintCoinsAvailable < WORD_WHEEL_HINT_COST) {
      showNotEnoughCoinsAlert();
      return;
    }

    const pick = hintCandidates[0];
    if (!pick) {
      Alert.alert(t('play.alert.noHint.title'), t('play.alert.noHint.body'));
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
        showNotEnoughCoinsAlert();
        return;
      }

      playSfx('bonus');
      const nextHints = new Map(hintLetters);
      nextHints.set(pick.key, pick.letter);
      setHintLetters(nextHints);
      setSelectedWord(pick.word);
      triggerCellRevealEffect([pick.key], 'new');

      // If hints (plus crossings) fully reveal a word, count it as found.
      // (Also covered by the reveal-sync effect; keeping this for snappy feedback.)
      const newlyCompleted = findWordsCompletedByReveal(
        foundWords,
        wordPositions,
        new Set(nextHints.keys())
      );
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
      setError(e?.message || t('play.error.hintFailed'));
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
    showNotEnoughCoinsAlert,
    t,
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            style={[
              styles.iconBtn,
              isRandomScene && styles.iconBtnOnScene,
            ]}
            onPress={handleBack}
          >
            <ArrowLeft color={isRandomScene ? '#0b3d36' : ww.text} size={22} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text
              style={[
                styles.levelHero,
                { color: ww.text },
                isRandomScene && styles.levelHeroOnScene,
              ]}
            >
              {isDaily
                ? dailyLabel
                : journeyLevel != null
                  ? t('common.level', { n: journeyLevel })
                  : t('common.levelFallback')}
            </Text>
          </View>
          {showHeaderNext && puzzleComplete ? (
            <Pressable
              style={[styles.headerNextBtn, { backgroundColor: ww.accentDark }]}
              onPress={() => {
                playSfx('click');
                handleNextPuzzle();
              }}
              accessibilityRole="button"
              accessibilityLabel={t('complete.next')}
            >
              <Text style={styles.headerNextText}>{t('complete.next')}</Text>
              <ChevronRight color="#fff" size={16} strokeWidth={2.6} />
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
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

        <SwipeableClueStrip
          text={clueStripText}
          placeholder={clueStripPlaceholder}
          canSwipe={unfoundClues.length > 1}
          onSwipe={goClue}
          backgroundColor={ww.clueBg}
          borderColor={ww.borderStrong}
          textColor={
            clueStripPlaceholder
              ? ww.textMuted || ww.clueText
              : ww.clueText || ww.text
          }
          prevA11y={t('play.clue.prev')}
          nextA11y={t('play.clue.next')}
          active={Boolean(selectedWheelWord)}
          overlay={
            selectedWheelWord ? (
              <View style={styles.wordOverlay}>
                <ClueLetterRow word={selectedWheelWord} />
              </View>
            ) : null
          }
        />

        {timerEnabled ? (
          <View
            style={styles.playTimerRow}
            accessibilityRole="text"
            accessibilityLabel={t('play.timer.a11y', { time: elapsedLabel })}
          >
            <Clock color={ww.textMuted || ww.clueText || ww.text} size={14} strokeWidth={2.2} />
            <Text style={[styles.playTimerText, { color: ww.clueText || ww.text }]}>
              {elapsedLabel}
            </Text>
          </View>
        ) : null}

        <View style={styles.wheelRow}>
          <View style={styles.sideTools}>
            <View style={styles.coinBurstWrap}>
              <CoinSparkBurst burstId={coinSparkBurstId} visible={coinSparkVisible} />
              <Animated.View style={[styles.coinRow, { transform: [{ scale: coinPulse }] }]}>
                <GiTwoCoins size={18} color="#facc15" />
                <Text
                  style={[
                    styles.coinLabel,
                    styles.coinLabelGold,
                    totalHintCoinsAvailable < WORD_WHEEL_HINT_COST && styles.coinLabelLow,
                  ]}
                >
                  {lifetimeCoinsRemaining}
                </Text>
              </Animated.View>
            </View>
            <Pressable
              style={[
                styles.toolBtn,
                { backgroundColor: ww.toolBtnBg, borderColor: ww.borderStrong },
                !canUseHint && styles.toolBtnDisabled,
              ]}
              onPress={handleHint}
              disabled={hintPending}
              accessibilityLabel={t('play.a11y.useHint')}
            >
              {hintPending ? (
                <ActivityIndicator color={ww.toolIcon} size="small" />
              ) : (
                <Lightbulb color={ww.toolIcon} size={18} />
              )}
            </Pressable>
            <Pressable
              style={[
                styles.toolBtn,
                { backgroundColor: ww.toolBtnBg, borderColor: ww.borderStrong },
              ]}
              onPress={() => setTreasureOpen(true)}
              accessibilityLabel={t('play.a11y.treasureChest')}
            >
              <PiTreasureChest size={18} color={ww.toolIcon} />
            </Pressable>
          </View>

          <LetterWheel
            tiles={wheelTiles}
            selectedIndices={selectedIndices}
            onSelectionChange={setSelectedIndices}
            onDragEnd={handleDragEnd}
            onShuffle={applyWheelShuffle}
            shuffleSignal={shuffleSignal}
            wheelSize={WHEEL_SIZE}
          />

          <View style={styles.sideTools}>
            <Pressable
              style={[
                styles.toolBtn,
                { backgroundColor: ww.toolBtnBg, borderColor: ww.borderStrong },
                !selectedWord && styles.toolBtnDisabled,
              ]}
              onPress={() => {
                setDictionaryWord(selectedWord || '');
                setDictionaryOpen(true);
              }}
              disabled={!selectedWord}
              accessibilityLabel={t('play.a11y.dictionary')}
            >
              <BookOpen color={ww.toolIcon} size={18} />
            </Pressable>
            <Pressable
              style={[styles.toolBtn, { backgroundColor: ww.toolBtnBg, borderColor: ww.borderStrong }]}
              onPress={handleShuffle}
              accessibilityLabel={t('play.a11y.shuffle')}
            >
              <Tornado color={ww.toolIcon} size={18} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <WordWheelDictionarySheet
        visible={dictionaryOpen}
        onClose={() => {
          setDictionaryOpen(false);
          setDictionaryWord('');
        }}
        word={dictionaryWord || ''}
        wordRevealed={dictionaryWordRevealed}
        language={puzzle?.language || 'english'}
      />

      <WordWheelCompleteDialog
        visible={completionDialogOpen}
        onClose={handleCloseCompletionDialog}
        onNext={handleNextPuzzle}
        durationLabel={completionStats?.durationLabel}
        scoreCoins={completionStats?.scoreCoins ?? 0}
        hintCoinsSpent={completionStats?.hintCoinsSpent ?? 0}
        levelNumber={completionStats?.levelNumber}
        forceScreenType={completionStats?.screenType}
      />

      <BonusWordModal
        visible={bonusWordModal.visible}
        word={bonusWordModal.word}
        awardedGift={bonusWordModal.awardedGift}
        giftCoins={bonusWordModal.pendingGift || WORD_WHEEL_BONUS_WORD_GIFT}
        onClose={handleBonusWordClose}
      />

      <TreasureBonusWordsModal
        visible={treasureOpen}
        onClose={() => setTreasureOpen(false)}
        words={bonusWordsFound}
        giftCoins={WORD_WHEEL_BONUS_WORD_GIFT}
        onWordPress={(word) => {
          const next = normalizeWord(word);
          setDictionaryWord(next);
          setTreasureOpen(false);
          setDictionaryOpen(true);
        }}
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
  levelHeroOnScene: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
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
  iconBtnOnScene: {
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  headerNextBtn: {
    minWidth: 52,
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  headerNextText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
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
  playTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
    marginBottom: 4,
    minHeight: 22,
  },
  playTimerText: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.4,
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
    overflow: 'visible',
    zIndex: 5,
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
  coinBurstWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 6,
  },
  coinRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  coinLabel: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  coinLabelGold: {
    color: '#facc15',
  },
  coinLabelLow: {
    color: '#fecaca',
  },
});
