import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ArrowLeft, BookOpen, ChevronRight, Clock, Eye, Gift, Lightbulb, Sparkles, Tornado, Volume2, VolumeX, X } from 'lucide-react-native';
import { GiTwoCoins } from '../components/GiTwoCoins';
import { PiTreasureChest } from '../components/PiTreasureChest';
import LetterWheel from '../components/LetterWheel';
import ClueLetterRow from '../components/ClueLetterRow';
import SwipeableClueStrip from '../components/SwipeableClueStrip';
import PuzzleGrid from '../components/PuzzleGrid';
import GradientBackground from '../components/GradientBackground';
import AdBanner from '../components/AdBanner';
import WordWheelCompleteDialog from '../components/WordWheelCompleteDialog';
import StarterPackGateModal from '../components/StarterPackGateModal';
import WordWheelDictionarySheet from '../components/WordWheelDictionarySheet';
import ShopOfferButton from '../components/intermission/ShopOfferButton';
import {
  consumeOneLetter,
  prepareRewardedAd,
  showRewardedCellAd,
  showRewardedLetterAd,
  trimExtraAdCredits,
  waitForAdCredits,
  withAdAudioMuted,
} from '../services/rewardedLetterAd';
import CreditApi from '../lib/creditApi';
// import BonusWordModal from '../components/BonusWordModal';
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
  clearStoredHintLetters,
  loadStoredHintLetters,
  saveStoredHintLetters,
} from '../lib/hintLettersStorage';
import {
  addGuestPuzzleCoins,
  loadGuestPuzzleCoins,
  saveGuestPuzzleCoins,
  spendGuestPuzzleCoins,
} from '../lib/guestCoinsStorage';
import { describeDailyGift, loadDailyGift } from '../lib/dailyGift';
import { isLoggedIn } from '../lib/auth';
import {
  guestNeedsStarterToContinue,
  hasStarterPackAccess,
  resolveDailyPlayAccess,
  resolveJourneyPlayAccess,
  resolveStarterUnlockLevel,
  settlePuzzlePlayCharge,
} from '../lib/guestStarterPack';
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
import { STARTER_PACK_PACKAGE_ID } from '../constants/guestAccess';
import { PLAY_MODE, SCREENS } from '../constants/theme';
import OnboardingOverlay from '../components/OnboardingOverlay';
import OnboardingSuccessOverlay from '../components/OnboardingSuccessOverlay';
import OnboardingWelcomeOverlay from '../components/OnboardingWelcomeOverlay';
import { markOnboardingComplete, ONBOARDING_PUZZLE, TUTORIAL_STEP } from '../lib/onboarding';
import { useAppearance } from '../context/AppearanceContext';
import { useAudio } from '../context/AudioContext';
import { usePlayTimer } from '../context/PlayTimerContext';
import { useT } from '../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Vertical space above the board: scroll padding + header.
 * Clue/wheel sit in a fixed bottom stack (not under the ad).
 */
const CHROME_H = 96;
/** Extra row shown only while the timer setting is on. */
const TIMER_ROW_H = 28;
/** Clue strip + margins in the bottom stack (portrait). */
const CLUE_STACK_H = 96;
/** Padding and margins around the wheel inside its dock. */
const WHEEL_DOCK_H = 40;

/**
 * The board is square and the wheel has a floor size, so on a short viewport
 * they cannot both be laid out vertically. Landscape puts them side by side,
 * which is also the only way an 8x8 board stays readable on a tablet.
 *
 * Portrait stacks clue → wheel → ad. Clue + wheel keep intrinsic height; the
 * board ScrollView shrinks first. The ad may clip off the bottom on short
 * screens — that is intentional.
 */
function usePlayMetrics(insets, timerEnabled) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const wheelSize = isLandscape
    ? Math.min(260, Math.max(170, height - 220), width * 0.42)
    : Math.min(width - 120, Math.max(200, height * 0.28), 260);

  // Do not reserve banner height — ad is allowed to clip under the fold.
  const verticalChrome =
    insets.top + CHROME_H + CLUE_STACK_H + (timerEnabled ? TIMER_ROW_H : 0);
  // In landscape the wheel sits beside the board, so it costs no height.
  const gridMaxSize = Math.max(
    150,
    height - verticalChrome - (isLandscape ? 0 : wheelSize + WHEEL_DOCK_H)
  );

  return { isLandscape, wheelSize, gridMaxSize };
}

export default function PlayScreen({ navigate, routeParams = {} }) {
  const isDaily = routeParams.mode === PLAY_MODE.DAILY;
  const dailyDate = routeParams.date;
  const seededPuzzle = routeParams.puzzle;
  const isOnboarding = Boolean(routeParams.isOnboarding);
  const wallet = useWordWheelWallet();
  const walletRef = useRef(wallet);
  walletRef.current = wallet;
  const { ww, colors, isDark, isRandomScene, setSceneLevel } = useAppearance();
  const { playSfx, soundEnabled, setSoundEnabled } = useAudio();
  const { timerEnabled } = usePlayTimer();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { isLandscape, wheelSize, gridMaxSize } = usePlayMetrics(insets, timerEnabled);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [puzzle, setPuzzle] = useState(null);
  const [foundWords, setFoundWords] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [wheelPreview, setWheelPreview] = useState('');
  const [playSession, setPlaySession] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wheelTiles, setWheelTiles] = useState([]);
  const [hintLetters, setHintLetters] = useState(() => new Map());
  const [hintCoinsSpent, setHintCoinsSpent] = useState(0);
  const [hintPending, setHintPending] = useState(false);
  const [letterBusy, setLetterBusy] = useState(false);
  const [cellAdBusy, setCellAdBusy] = useState(false);
  const letterBusyRef = useRef(false);
  const adGuardUntilRef = useRef(0);
  const [creditSheetOpen, setCreditSheetOpen] = useState(false);
  const [coinsAlertOpen, setCoinsAlertOpen] = useState(false);
  const [playSessionCoins, setPlaySessionCoins] = useState(0);
  const [todayGiftCoins, setTodayGiftCoins] = useState(0);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [dictionaryWord, setDictionaryWord] = useState('');
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [completionStats, setCompletionStats] = useState(null);
  const [showHeaderNext, setShowHeaderNext] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingFocusRects, setOnboardingFocusRects] = useState({});
  const [onboardingWelcomeVisible, setOnboardingWelcomeVisible] = useState(() =>
    Boolean(routeParams.isOnboarding)
  );
  const [tutorialCredits, setTutorialCredits] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const failCountRef = useRef(0);
  // After a letter is shown, keep the hint-plus-ad icon hidden until this many misses.
  const [adHideUntil, setAdHideUntil] = useState(3);
  // After a cell ad, the next icon starts on the next empty cell of that word.
  const [cellAdCursor, setCellAdCursor] = useState({});
  const [onboardingSuccessVisible, setOnboardingSuccessVisible] = useState(false);
  const onboardingSuccessNextStepRef = useRef(1);
  const onboardingOverlayRef = useRef(null);
  const onboardingScrollRef = useRef(null);
  const onboardingClueWrapRef = useRef(null);
  const onboardingClueContentLayoutRef = useRef({ y: 0, height: 0 });
  const onboardingScrollYRef = useRef(0);
  const onboardingClueRef = useRef(null);
  const onboardingWheelRef = useRef(null);
  const onboardingHintRef = useRef(null);
  const onboardingBoardMetricsRef = useRef(null);
  const onboardingGridBoardRef = useRef(null);
  const onboardingCreditRef = useRef(null);
  const onboardingEyeRef = useRef(null);
  const finishingOnboardingRef = useRef(false);
  const [bonusWordModal, setBonusWordModal] = useState({
    visible: false,
    word: '',
    awardedGift: false,
    pendingGift: 0,
  });
  const coinPulse = useRef(new Animated.Value(1)).current;
  const [eyeAttention, setEyeAttention] = useState(false);
  const eyeFlicker = useRef(new Animated.Value(1)).current;
  const creditFlicker = useRef(new Animated.Value(1)).current;
  const eyeScale = useRef(new Animated.Value(1)).current;
  const eyeGlow = useRef(new Animated.Value(0)).current;
  const eyeAttentionTimer = useRef(null);
  const [coinSparkBurstId, setCoinSparkBurstId] = useState(0);
  const [coinSparkVisible, setCoinSparkVisible] = useState(false);
  const coinSparkClearRef = useRef(null);
  const [bonusWordsFound, setBonusWordsFound] = useState([]);
  const [treasureOpen, setTreasureOpen] = useState(false);
  const [shuffleSignal, setShuffleSignal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [hasStarterAccess, setHasStarterAccess] = useState(true);
  const [starterGateVisible, setStarterGateVisible] = useState(false);
  const [starterGateContext, setStarterGateContext] = useState('level');
  const [coinsCatalog, setCoinsCatalog] = useState([]);
  const [celebratingCellKeys, setCelebratingCellKeys] = useState(() => new Set());
  const [celebrateOrder, setCelebrateOrder] = useState([]);
  const [celebrateMode, setCelebrateMode] = useState('new');
  const [revealBurstId, setRevealBurstId] = useState(0);
  const completionShownRef = useRef(false);
  const levelStartedAtRef = useRef(null);
  const hintsReadyRef = useRef(false);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [elapsedLabel, setElapsedLabel] = useState('0:00');
  const bonusWordLookupRef = useRef(false);
  const pinCompletedClueRef = useRef(false);
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

  // Default the clue strip to the first unsolved word; advance when the current
  // selection is solved unless the player tapped a completed cell to review it.
  useEffect(() => {
    if (!selectedWord && unfoundClues.length > 0) {
      setSelectedWord(unfoundClues[0].word);
      pinCompletedClueRef.current = false;
      return;
    }
    if (!selectedWord) return;
    const normalizedSelected = normalizeWord(selectedWord);
    const isUnfound = unfoundClues.some((entry) => entry.word === normalizedSelected);
    if (!isUnfound && unfoundClues.length > 0 && !pinCompletedClueRef.current) {
      setSelectedWord(unfoundClues[0].word);
    }
  }, [unfoundClues, selectedWord]);

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
  const selectedNorm = selectedWord ? normalizeWord(selectedWord) : '';
  const selectedWordNumber =
    (selectedNorm ? wordToNumber.get(selectedNorm) : null)
    ?? activeClue?.number
    ?? null;
  const selectedClue =
    (selectedNorm ? clueMap.get(selectedNorm) : '')
    || activeClue?.clue
    || '';
  const selectedWordCells = useMemo(() => {
    const word = selectedNorm || activeClue?.word;
    if (!word || !wordPositions[normalizeWord(word)]) return new Set();
    return new Set(wordPositions[normalizeWord(word)].map((p) => `${p.row},${p.col}`));
  }, [activeClue, selectedNorm, wordPositions]);

  const cellAdKeys = useMemo(() => {
    if (isOnboarding) {
      return onboardingStep === TUTORIAL_STEP.CELL_AD ? new Set(['3,4']) : new Set();
    }
    if (failCount < adHideUntil) return new Set();
    const hiddenOf = (word) => (
      (wordPositions[word] || []).filter((p) => !displayGrid[p.row]?.[p.col])
    );
    const selected = normalizeWord(selectedWord || '');
    const selectedHidden = selected && !foundWords.includes(selected) ? hiddenOf(selected) : [];
    const tracked = selectedHidden.length >= 2
      ? selected
      : (unfoundClues
        .map((entry) => normalizeWord(entry.word))
        .find((word) => hiddenOf(word).length >= 2) || '');
    if (!tracked) return new Set();
    const startIndex = cellAdCursor[tracked]?.startIndex || 0;
    const hidden = hiddenOf(tracked);
    if (hidden.length < 2) return new Set();
    const hop = startIndex + Math.floor((failCount - adHideUntil) / 3);
    const cell = hidden[hop % hidden.length];
    return new Set([`${cell.row},${cell.col}`]);
  }, [
    isOnboarding,
    onboardingStep,
    failCount,
    adHideUntil,
    selectedWord,
    foundWords,
    unfoundClues,
    cellAdCursor,
    wordPositions,
    displayGrid,
  ]);

  const goClue = useCallback(
    (delta) => {
      if (unfoundClues.length > 0) {
        pinCompletedClueRef.current = false;
        const next = (clueIndex + delta + unfoundClues.length) % unfoundClues.length;
        setSelectedWord(unfoundClues[next].word);
      }
      // Step 1: clue swipe → congrats flash, then wheel step.
      if (isOnboarding && onboardingStep === 0 && !onboardingSuccessVisible) {
        playSfx('complete');
        onboardingSuccessNextStepRef.current = 1;
        setOnboardingSuccessVisible(true);
      }
    },
    [unfoundClues, clueIndex, isOnboarding, onboardingStep, onboardingSuccessVisible, playSfx]
  );
  const clueWord = selectedNorm || activeClue?.word || unfoundClues[0]?.word || targetWords[0] || '';
  const clueBody = selectedClue || activeClue?.clue || clueWord;
  const clueStripText = clueWord
    ? `${selectedWordNumber != null ? `${selectedWordNumber}. ` : ''}${clueBody}`
    : '';
  const clueStripPlaceholder = !clueWord;

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

  useEffect(() => {
    let cancelled = false;
    loadDailyGift().then((record) => {
      if (cancelled) return;
      const view = describeDailyGift(record);
      setTodayGiftCoins(view.claimed ? view.coins : 0);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const lifetimeCoinsRemaining = wallet.loggedIn
    ? Math.max(0, wallet.lifetimePoints)
    : Math.max(0, playSessionCoins);
  const totalHintCoinsAvailable = lifetimeCoinsRemaining + wallet.creditBalance;
  const canUseHint =
    !puzzleComplete
    && !hintPending
    && !isOnboarding
    && hintCandidates.length > 0
    && totalHintCoinsAvailable >= WORD_WHEEL_HINT_COST;

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

  useEffect(() => {
    if (!isDaily && journeyLevel != null) setSceneLevel(journeyLevel);
  }, [isDaily, journeyLevel, setSceneLevel]);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const access = await hasStarterPackAccess();
      if (cancelled) return;
      setHasStarterAccess(access);
      if (routeParams.starterUnlockTick && access && !isDaily && !isOnboarding) {
        setReloadKey((k) => k + 1);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeParams.starterUnlockTick, isDaily, isOnboarding]);

  const resetPlayState = useCallback(() => {
    setFoundWords([]);
    setSelectedIndices([]);
    setPlaySession(null);
    setSelectedWord(null);
    pinCompletedClueRef.current = false;
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
    hintsReadyRef.current = false;
    setTimerStartedAt(null);
    setElapsedLabel('0:00');
    bonusWordLookupRef.current = false;
    setBonusWordModal({ visible: false, word: '', awardedGift: false, pendingGift: 0 });
    setBonusWordsFound([]);
    setTreasureOpen(false);
    setFailCount(0);
    failCountRef.current = 0;
    setAdHideUntil(3);
    setCellAdCursor({});
  }, []);

  /**
   * Restore the guest HUD from storage. Runs before the play session starts so a
   * failed `startPlay` can't leave the balance on its initial 0. Returns the
   * stored value, or `null` when this device has no guest balance yet.
   */
  const restoreGuestCoinBalance = useCallback(async () => {
    if (await isLoggedIn()) return null;
    const stored = await loadGuestPuzzleCoins();
    setPlaySessionCoins(stored ?? 0);
    return stored;
  }, []);

  const pulseCoinBalance = useCallback(() => {
    coinPulse.stopAnimation((current = 1) => {
      coinPulse.setValue(typeof current === 'number' ? current : 1);
      Animated.sequence([
        Animated.timing(coinPulse, {
          toValue: 1.22,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(coinPulse, {
          toValue: 1,
          duration: 340,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });

    if (coinSparkClearRef.current) clearTimeout(coinSparkClearRef.current);
    setCoinSparkVisible(true);
    setCoinSparkBurstId((id) => id + 1);
    coinSparkClearRef.current = setTimeout(() => {
      setCoinSparkVisible(false);
      coinSparkClearRef.current = null;
    }, 900);
  }, [coinPulse]);

  const startEyeAttention = useCallback(() => {
    setEyeAttention(true);
    if (eyeAttentionTimer.current) clearTimeout(eyeAttentionTimer.current);
    eyeAttentionTimer.current = setTimeout(() => {
      setEyeAttention(false);
      eyeAttentionTimer.current = null;
    }, 4800);
  }, []);

  useEffect(() => {
    if (!eyeAttention) {
      eyeFlicker.setValue(1);
      eyeScale.setValue(1);
      eyeGlow.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(eyeFlicker, {
            toValue: 0.28,
            duration: 220,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(eyeScale, {
            toValue: 1.22,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(eyeGlow, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(eyeFlicker, {
            toValue: 1,
            duration: 220,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(eyeScale, {
            toValue: 1,
            duration: 220,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(eyeGlow, {
            toValue: 0.2,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    playSfx('adReward');
    return () => loop.stop();
  }, [eyeAttention, eyeFlicker, eyeScale, eyeGlow, playSfx]);

  useEffect(() => {
    if (!isOnboarding || onboardingStep !== TUTORIAL_STEP.EYE) {
      creditFlicker.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(creditFlicker, {
          toValue: 0.25,
          duration: 280,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(creditFlicker, {
          toValue: 1,
          duration: 280,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    playSfx('adReward');
    return () => loop.stop();
  }, [isOnboarding, onboardingStep, creditFlicker, playSfx]);

  const applyBonusWordGift = useCallback(
    (amount) => {
      const gift = Math.max(0, Number(amount) || 0);
      if (!gift) return;
      if (wallet.loggedIn) {
        wallet.addLifetimePoints?.(gift);
      } else {
        // Show the gift right away, then settle on the persisted total. Without
        // the reconcile a failed write left the HUD ahead of storage, and the
        // coin appeared to vanish when the next puzzle re-read the balance.
        setPlaySessionCoins((prev) => prev + gift);
        addGuestPuzzleCoins(gift)
          .then((total) => setPlaySessionCoins(total))
          .catch(() => setPlaySessionCoins((prev) => Math.max(0, prev - gift)));
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
        if (isOnboarding) {
          if (!cancelled) {
            setPuzzle(ONBOARDING_PUZZLE);
            // Tutorial HUD starts with enough coins for one hint demo.
            setPlaySessionCoins(WORD_WHEEL_HINT_COST);
            const startedAt = Date.now();
            levelStartedAtRef.current = startedAt;
            setTimerStartedAt(startedAt);
          }
          return;
        }
        let data = isDaily
          ? await WordWheelApi.fetchDaily(dailyDate)
          : (reloadKey === 0 && seededPuzzle?.id
            ? seededPuzzle
            : await WordWheelApi.fetchNext());

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

        const authed = await isLoggedIn();
        const starterAccess = await hasStarterPackAccess();

        if (isDaily) {
          const dailyAccess = await resolveDailyPlayAccess({
            hasStarter: starterAccess,
            loggedIn: authed,
            creditBalance: walletRef.current.creditBalance,
          });
          if (dailyAccess === 'starter') {
            setPuzzle(null);
            setError(t('play.error.starterRequired'));
            setStarterGateContext('daily');
            setStarterGateVisible(true);
            return;
          }
          if (dailyAccess === 'no_credits') {
            setPuzzle(null);
            setError(t('play.error.noCredits'));
            setStarterGateContext('credits');
            setStarterGateVisible(true);
            return;
          }
        } else if (!isOnboarding) {
          const level = resolveJourneyLevel(data) ?? Number(data?.puzzleLevel);
          const playerJourneyLevel = level;
          const journeyAccess = await resolveJourneyPlayAccess(level, {
            hasStarter: starterAccess,
            loggedIn: authed,
            creditBalance: walletRef.current.creditBalance,
            playerJourneyLevel,
          });
          if (journeyAccess === 'starter') {
            setPuzzle(null);
            setError(t('play.error.starterRequired'));
            setStarterGateContext('level');
            setStarterGateVisible(true);
            return;
          }
          if (journeyAccess === 'no_credits') {
            setPuzzle(null);
            setError(t('play.error.noCredits'));
            setStarterGateContext('credits');
            setStarterGateVisible(true);
            return;
          }
        }
        setHasStarterAccess(starterAccess);

        completedPuzzleIdRef.current = null;
        completedLevelRef.current = null;
        completedSeasonRef.current = null;
        setPuzzle(data);
        // Show the grid immediately; session start can finish in the background.
        setLoading(false);

        const storedGuestCoins = await restoreGuestCoinBalance();

        const play = await WordWheelApi.startPlay(data.id);
        if (!cancelled && play && !play.code) {
          const journeyLevel =
            resolveJourneyLevel(data) ?? Number(data?.puzzleLevel) ?? null;
          const charge = await settlePuzzlePlayCharge({
            isDaily,
            journeyLevel,
            puzzleId: data.id,
            loggedIn: authed,
            creditBalance: walletRef.current.creditBalance,
            playerJourneyLevel: journeyLevel,
          });
          if (!charge.ok) {
            setPuzzle(null);
            setError(
              charge.access === 'no_credits'
                ? t('play.error.noCredits')
                : t('play.error.starterRequired')
            );
            setStarterGateContext(charge.access === 'no_credits' ? 'credits' : isDaily ? 'daily' : 'level');
            setStarterGateVisible(true);
            return;
          }
          if (charge.creditBalance != null) {
            walletRef.current.refresh({ silent: true }).catch(() => {});
          }
          setPlaySession(play);
          const startedAt = Date.now();
          levelStartedAtRef.current = startedAt;
          setTimerStartedAt(startedAt);
          const saved = (play.wordsFound || '')
            .split('\n')
            .map(normalizeWord)
            .filter(Boolean);
          setFoundWords(saved);
          const storedHints = await loadStoredHintLetters(data.id);
          if (!cancelled) {
            if (storedHints.size) setHintLetters(storedHints);
            hintsReadyRef.current = true;
          }
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
          if (authed) {
            setPlaySessionCoins(Number(play.totalPuzzleCoins) || 0);
          } else if (storedGuestCoins == null && bonus.length) {
            // Nothing stored on this device yet, but this puzzle already has
            // bonus words credited — rebuild the balance from them rather than
            // starting the player back at zero.
            const seeded = bonus.length * WORD_WHEEL_BONUS_WORD_GIFT;
            try {
              setPlaySessionCoins(await saveGuestPuzzleCoins(seeded));
            } catch {
              setPlaySessionCoins(seeded);
            }
          }
        } else if (!cancelled) {
          // Still time the attempt even if play session start fails.
          const startedAt = Date.now();
          levelStartedAtRef.current = startedAt;
          setTimerStartedAt(startedAt);
          const storedHints = await loadStoredHintLetters(data.id);
          if (!cancelled) {
            if (storedHints.size) setHintLetters(storedHints);
            hintsReadyRef.current = true;
          }
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
  }, [isDaily, isOnboarding, dailyDate, reloadKey, resetPlayState, restoreGuestCoinBalance, seededPuzzle, t]);

  const handleNextPuzzle = useCallback(async () => {
    if (isDaily) {
      setCompletionDialogOpen(false);
      setShowHeaderNext(false);
      navigate(SCREENS.DAILY, { date: dailyDate });
      return;
    }
    const completedLevel = resolveJourneyLevel(puzzle) ?? Number(puzzle?.puzzleLevel) ?? null;
    const starterAccess = await hasStarterPackAccess();
    const authed = await isLoggedIn();
    const nextLevel = (completedLevel ?? 0) + 1;
    const access = await resolveJourneyPlayAccess(nextLevel, {
      hasStarter: starterAccess,
      loggedIn: authed,
      creditBalance: wallet.creditBalance,
      playerJourneyLevel: completedLevel,
    });
    if (access === 'starter') {
      setCompletionDialogOpen(false);
      setShowHeaderNext(false);
      setStarterGateContext('level');
      setStarterGateVisible(true);
      return;
    }
    if (access === 'no_credits') {
      setCompletionDialogOpen(false);
      setShowHeaderNext(false);
      setStarterGateContext('credits');
      setStarterGateVisible(true);
      return;
    }
    setHasStarterAccess(starterAccess);
    completedPuzzleIdRef.current = puzzle?.id || null;
    completedLevelRef.current = completedLevel;
    completedSeasonRef.current = puzzle?.season || DEFAULT_SEASON;
    setCompletionDialogOpen(false);
    setShowHeaderNext(false);
    setReloadKey((k) => k + 1);
  }, [isDaily, dailyDate, navigate, puzzle, wallet.creditBalance]);

  const handleCloseCompletionDialog = useCallback(() => {
    setCompletionDialogOpen(false);
    setShowHeaderNext(true);
  }, []);

  const handleCompletionShop = useCallback(() => {
    setCompletionDialogOpen(false);
    setShowHeaderNext(false);
    navigate(SCREENS.SHOP, {
      backScreen: isDaily ? SCREENS.DAILY_PLAY : SCREENS.PLAY,
      mode: routeParams.mode,
      date: routeParams.date,
      packageId: STARTER_PACK_PACKAGE_ID,
    });
  }, [isDaily, navigate, routeParams.mode, routeParams.date]);

  const handleStarterGateShop = useCallback(() => {
    setStarterGateVisible(false);
    navigate(SCREENS.SHOP, {
      backScreen: isDaily ? SCREENS.DAILY_PLAY : SCREENS.PLAY,
      mode: routeParams.mode,
      date: routeParams.date,
      packageId: STARTER_PACK_PACKAGE_ID,
    });
  }, [isDaily, navigate, routeParams.mode, routeParams.date]);

  const showStarterOffer = useMemo(
    () =>
      !isOnboarding
      && !isDaily
      && !hasStarterAccess
      && guestNeedsStarterToContinue(
        completionStats?.levelNumber,
        false,
        completionStats?.levelNumber
      ),
    [isOnboarding, isDaily, hasStarterAccess, completionStats?.levelNumber]
  );

  const starterUnlockLevel = useMemo(
    () => resolveStarterUnlockLevel(
      resolveJourneyLevel(puzzle) ?? completionStats?.levelNumber ?? null
    ),
    [puzzle, completionStats?.levelNumber]
  );

  const finishOnboarding = useCallback(async () => {
    if (finishingOnboardingRef.current) return;
    finishingOnboardingRef.current = true;
    playSfx('levelUp');
    await markOnboardingComplete();
    navigate(SCREENS.PLAY, {
      mode: PLAY_MODE.JOURNEY,
      puzzle: routeParams.puzzle,
      isOnboarding: false,
      t: Date.now(),
    });
  }, [navigate, routeParams.puzzle, playSfx]);

  const measureOnboardingFocus = useCallback(() => {
    if (!isOnboarding) return;
    const overlayNode = onboardingOverlayRef.current;
    if (!overlayNode || typeof overlayNode.measureInWindow !== 'function') return;

    const next = {};
    let pending = 7;
    const done = () => {
      pending -= 1;
      if (pending <= 0) {
        setOnboardingFocusRects((prev) => ({
          ...next,
          // Keep the L spotlight stable across remount/remeasure flicker.
          letter: next.letter || prev.letter,
        }));
      }
    };

    // Clue may sit in the bottom stack (portrait) or inside the board ScrollView
    // (landscape). measureInWindow works for both.
    const measureClueBand = () => {
      const clueNode = onboardingClueWrapRef.current;
      if (!clueNode || typeof clueNode.measureInWindow !== 'function') {
        done();
        return;
      }
      overlayNode.measureInWindow((ox, oy, overlayW) => {
        clueNode.measureInWindow((x, y, width, height) => {
          if (height > 0) {
            next.clue = {
              x: 0,
              y: y - oy,
              width: overlayW > 0 ? overlayW : Dimensions.get('window').width,
              height,
            };
          }
          done();
        });
      });
    };

    const captureOutsideScroll = (key, ref) => {
      const node = ref.current;
      if (!node || typeof node.measureInWindow !== 'function') {
        done();
        return;
      }
      overlayNode.measureInWindow((ox, oy) => {
        node.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            next[key] = {
              x: x - ox,
              y: y - oy,
              width,
              height,
            };
          }
          done();
        });
      });
    };

    const measureLetterCell = () => {
      const board = onboardingBoardMetricsRef.current;
      const boardNode = onboardingGridBoardRef.current;
      if (!board || !(board.cellSize > 0)) {
        done();
        return;
      }
      // Tutorial L in LOG is at row 3, col 2 (grid coords).
      const row = 3;
      const col = 2;
      const minRow = board.minRow ?? 0;
      const minCol = board.minCol ?? 0;
      const apply = (bx, by) => {
        overlayNode.measureInWindow((ox, oy) => {
          next.letter = {
            x: bx - ox + (col - minCol) * (board.cellSize + board.gap),
            y: by - oy + (row - minRow) * (board.cellSize + board.gap),
            width: board.cellSize,
            height: board.cellSize,
          };
          done();
        });
      };
      if (boardNode && typeof boardNode.measureInWindow === 'function') {
        boardNode.measureInWindow((bx, by) => apply(bx, by));
      } else {
        apply(board.x, board.y);
      }
    };

    const measureCellAd = () => {
      const board = onboardingBoardMetricsRef.current;
      const boardNode = onboardingGridBoardRef.current;
      if (!board || !(board.cellSize > 0)) {
        done();
        return;
      }
      const row = 3;
      const col = 4;
      const minRow = board.minRow ?? 0;
      const minCol = board.minCol ?? 0;
      const apply = (bx, by) => {
        overlayNode.measureInWindow((ox, oy) => {
          next.cellAd = {
            x: bx - ox + (col - minCol) * (board.cellSize + board.gap),
            y: by - oy + (row - minRow) * (board.cellSize + board.gap),
            width: board.cellSize,
            height: board.cellSize,
          };
          done();
        });
      };
      if (boardNode && typeof boardNode.measureInWindow === 'function') {
        boardNode.measureInWindow((bx, by) => apply(bx, by));
      } else {
        apply(board.x, board.y);
      }
    };

    measureClueBand();
    captureOutsideScroll('wheel', onboardingWheelRef);
    captureOutsideScroll('hint', onboardingHintRef);
    captureOutsideScroll('credit', onboardingCreditRef);
    captureOutsideScroll('eye', onboardingEyeRef);
    measureLetterCell();
    measureCellAd();
  }, [isOnboarding]);

  useEffect(() => {
    if (!isOnboarding) return undefined;
    const timers = [0, 80, 200, 400].map((ms) => setTimeout(measureOnboardingFocus, ms));
    return () => timers.forEach(clearTimeout);
  }, [isOnboarding, onboardingStep, loading, measureOnboardingFocus]);

  const persistProgress = useCallback(
    async (words, bonusWords = bonusWordsFound) => {
      if (isOnboarding || !puzzle?.id) return null;
      try {
        const updated = await WordWheelApi.updateProgress(puzzle.id, words, bonusWords);
        if (updated && !updated.code) {
          setPlaySession(updated);
          // Guest coin HUD is local/durable — don't let server totals wipe bonus gifts.
          if (wallet.loggedIn && updated.totalPuzzleCoins != null) {
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
    [isOnboarding, puzzle, t, bonusWordsFound, wallet.loggedIn]
  );

  const persistBonusWords = useCallback(
    async (words) => {
      if (isOnboarding || !puzzle?.id) return;
      await saveStoredBonusWords(puzzle.id, words);
      try {
        await WordWheelApi.updateProgress(puzzle.id, foundWords, words);
      } catch {
        // Local cache already saved; server sync is best-effort.
      }
    },
    [isOnboarding, puzzle?.id, foundWords]
  );

  const celebrateClearRef = useRef(null);
  const triggerCellRevealEffect = useCallback((keys, mode = 'new') => {
    const cellKeys = (keys || []).filter(Boolean);
    if (!cellKeys.length) return;
    if (celebrateClearRef.current) {
      clearTimeout(celebrateClearRef.current);
      celebrateClearRef.current = null;
    }
    setCelebrateMode(mode);
    setCelebrateOrder(cellKeys);
    setCelebratingCellKeys(new Set(cellKeys));
    setRevealBurstId((id) => id + 1);
    celebrateClearRef.current = setTimeout(() => {
      setCelebratingCellKeys(new Set());
      setCelebrateOrder([]);
      setCelebrateMode('new');
      celebrateClearRef.current = null;
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
      if (isOnboarding) {
        completionShownRef.current = true;
        return;
      }
      completionShownRef.current = true;
      playSfx('complete');
      if (puzzle?.id) clearStoredHintLetters(puzzle.id).catch(() => {});
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
    [targetWords.length, hintCoinsSpent, wallet, playSfx, coinsCatalog, isDaily, isOnboarding, puzzle]
  );

  // Keep credit/hint letter reveals across leave/re-enter for this puzzle.
  useEffect(() => {
    if (isOnboarding || !puzzle?.id || !hintsReadyRef.current) return;
    saveStoredHintLetters(puzzle.id, hintLetters);
  }, [isOnboarding, puzzle?.id, hintLetters]);

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

  const noteWordMiss = useCallback(() => {
    if (isOnboarding) return;
    setFailCount((count) => count + 1);
  }, [isOnboarding]);

  useEffect(() => {
    failCountRef.current = failCount;
  }, [failCount]);

  const submitWord = useCallback(
    async (wordRaw) => {
      const word = normalizeWord(wordRaw);
      if (word.length < 3) return false;

      if (!targetWords.includes(word)) {
        if (isOnboarding) {
          playSfx('wrong');
          return false;
        }
        // Same bonus word again — no second gift.
        if (bonusWordsFound.includes(word)) {
          noteWordMiss();
          playSfx('wrong');
          return false;
        }
        // Count now. A later bonus hit undoes this one try.
        // Tries that arrive while a lookup is in flight still count.
        noteWordMiss();
        if (bonusWordLookupRef.current) {
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
          setFailCount((count) => Math.max(0, count - 1));

          setBonusWordsFound((prev) => {
            const next = prev.includes(word) ? prev : [...prev, word];
            persistBonusWords(next);
            return next;
          });
          playSfx('chime');
          // Bonus-word popup disabled — still award coins + coin pulse.
          // setBonusWordModal({
          //   visible: true,
          //   word,
          //   awardedGift: true,
          //   pendingGift: WORD_WHEEL_BONUS_WORD_GIFT,
          // });
          applyBonusWordGift(WORD_WHEEL_BONUS_WORD_GIFT);
          return true;
        } finally {
          bonusWordLookupRef.current = false;
        }
      }

      // Already revealed — pulse the cells so the player knows.
      if (foundWords.includes(word)) {
        playSfx('chime');
        pinCompletedClueRef.current = true;
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
      pinCompletedClueRef.current = false;
      setFoundWords(next);
      setSelectedWord(null);
      triggerWordRevealEffect(word, 'new');
      cascaded.forEach((w) => {
        if (w !== word) triggerWordRevealEffect(w, 'new');
      });

      // Step 2: first correct wheel word → congrats, then hint step.
      if (isOnboarding && onboardingStep === 1 && !onboardingSuccessVisible) {
        playSfx('complete');
        onboardingSuccessNextStepRef.current = TUTORIAL_STEP.CELL_AD;
        setOnboardingSuccessVisible(true);
      }

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
      applyBonusWordGift,
      isOnboarding,
      onboardingStep,
      onboardingSuccessVisible,
      noteWordMiss,
    ]
  );

  useEffect(() => {
    if (!isOnboarding) return;
    // Don't auto-jump (or pull back) during wheel / hint / letter-review steps.
    if (onboardingSuccessVisible || onboardingStep >= 1) return;
    if (foundWords.length >= targetWords.length && targetWords.length > 0) return;
    if (foundWords.length > 0) {
      setOnboardingStep((s) => Math.min(2, Math.max(s, foundWords.length)));
    }
  }, [
    isOnboarding,
    foundWords.length,
    targetWords.length,
    onboardingSuccessVisible,
    onboardingStep,
  ]);

  const handleDragEnd = useCallback(
    (word) => {
      if (word.length >= 3) submitWord(word);
      else if (word.length > 0) {
        noteWordMiss();
        playSfx('wrong');
      }
    },
    [submitWord, playSfx, noteWordMiss]
  );

  const handleCellPress = useCallback(
    (row, col) => {
      setSelectedIndices([]);
      const matches = findWordsAtCell(puzzle?.filledCoordinates, row, col, cellWordNumbers);
      if (!matches.length) return;

      const open = matches.filter((m) => !foundWords.includes(m.word));
      const pool = open.length ? open : matches;
      pinCompletedClueRef.current = open.length === 0;
      if (pool.length === 1) {
        setSelectedWord(pool[0].word);
        return;
      }
      // Crossing cell: tap again to cycle the other word's clue.
      const current = selectedWord ? normalizeWord(selectedWord) : '';
      const idx = pool.findIndex((m) => m.word === current);
      const next = pool[(idx + 1) % pool.length];
      setSelectedWord(next.word);
    },
    [puzzle?.filledCoordinates, cellWordNumbers, foundWords, selectedWord]
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

  const openCoinShop = useCallback(() => {
    setCoinsAlertOpen(false);
    playSfx('click');
    navigate(SCREENS.SHOP, {
      backScreen: isDaily ? SCREENS.DAILY_PLAY : SCREENS.PLAY,
      mode: routeParams.mode,
      date: routeParams.date,
    });
  }, [playSfx, navigate, isDaily, routeParams.mode, routeParams.date]);

  const showNotEnoughCoinsAlert = useCallback(() => {
    setCoinsAlertOpen(true);
  }, []);

  const handleHint = useCallback(async () => {
    if (puzzleComplete) return;
    if (hintPending) return;

    if (isOnboarding) return;

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
        if (wallet.loggedIn) {
          wallet.spendLifetimePoints?.(WORD_WHEEL_HINT_COST);
        } else {
          // Only charge the session counter once the deduction is persisted.
          setPlaySessionCoins(await spendGuestPuzzleCoins(WORD_WHEEL_HINT_COST));
        }
        setHintCoinsSpent((prev) => prev + WORD_WHEEL_HINT_COST);
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
    isOnboarding,
    onboardingStep,
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
    measureOnboardingFocus,
  ]);

  const applyRevealedLetters = useCallback((picks) => {
    if (!picks.length) return;
    setHintLetters((prev) => {
      const nextHints = new Map(prev);
      picks.forEach((pick) => {
        const letter = String(pick?.letter || '').trim().toUpperCase();
        if (pick?.key && letter) nextHints.set(pick.key, letter);
      });
      return nextHints;
    });
    if (picks[0]?.word) setSelectedWord(picks[0].word);
    // A shown letter is not a miss. Keep the icon down until three new tries.
    setAdHideUntil(failCountRef.current + 3);
    triggerCellRevealEffect(
      picks.map((pick) => pick.key).filter(Boolean),
      'new'
    );
  }, [triggerCellRevealEffect]);

  const handleShowOneLetter = useCallback(async () => {
    if (puzzleComplete || letterBusyRef.current) return;
    if (eyeAttentionTimer.current) {
      clearTimeout(eyeAttentionTimer.current);
      eyeAttentionTimer.current = null;
    }
    setEyeAttention(false);
    if (Date.now() < adGuardUntilRef.current) return;
    if (isOnboarding) {
      if (onboardingStep !== TUTORIAL_STEP.EYE || tutorialCredits < 1) return;
      setLetterBusy(true);
      try {
        setTutorialCredits(0);
        setHintLetters((prev) => {
          const next = new Map(prev);
          next.set('3,2', 'L');
          return next;
        });
        setSelectedWord('LOG');
        triggerCellRevealEffect(['3,2'], 'new');
        playSfx('bonus');
        setOnboardingStep(TUTORIAL_STEP.DONE);
        setTimeout(measureOnboardingFocus, 80);
      } finally {
        setLetterBusy(false);
      }
      return;
    }
    if ((wallet.creditBalance ?? 0) < 1) {
      setCreditSheetOpen(true);
      return;
    }
    const word = normalizeWord(selectedWord);
    const pick = (word && hintCandidates.find((candidate) => candidate.word === word))
      || hintCandidates[0];
    if (!pick?.key || !pick?.letter) {
      Alert.alert(t('play.alert.noHint.title'), t('play.alert.noHint.body'));
      return;
    }
    letterBusyRef.current = true;
    setLetterBusy(true);
    try {
      // Ad grants land on the device wallet; merge first so a signed-in spend works.
      await CreditApi.mergeGuestCredits().catch(() => null);
      const spent = await consumeOneLetter(playSession?.id, pick.key);
      wallet.noteCreditBalance?.(spent?.creditBalance ?? Math.max(0, (wallet.creditBalance ?? 0) - 1));
      // Reveal before wallet refresh — refreshing used to remount the puzzle load effect.
      applyRevealedLetters([pick]);
      wallet.refresh({ silent: true }).catch(() => {});
    } catch (e) {
      Alert.alert(t('play.letter.failed.title'), e?.message || t('play.letter.failed.body'));
    } finally {
      letterBusyRef.current = false;
      setLetterBusy(false);
    }
  }, [
    isOnboarding,
    onboardingStep,
    tutorialCredits,
    puzzleComplete,
    wallet,
    hintCandidates,
    selectedWord,
    playSession?.id,
    applyRevealedLetters,
    triggerCellRevealEffect,
    measureOnboardingFocus,
    playSfx,
    t,
  ]);

  const handleWatchAd = useCallback(async () => {
    if (letterBusyRef.current || isOnboarding || Date.now() < adGuardUntilRef.current) return;
    letterBusyRef.current = true;
    setLetterBusy(true);
    setCreditSheetOpen(false);
    try {
      const before = (await CreditApi.fetchDeviceBalance()).creditBalance;
      const deviceId = await prepareRewardedAd();
      if (__DEV__) console.log('[Ad] deviceId', deviceId, 'before', before);
      const earned = await withAdAudioMuted(() => showRewardedLetterAd(deviceId));
      adGuardUntilRef.current = Date.now() + 1600;
      if (!earned) return;
      const after = await waitForAdCredits(before);
      const trimmed = await trimExtraAdCredits(before, after);
      wallet.noteCreditBalance?.(trimmed);
      await CreditApi.mergeGuestCredits().catch(() => null);
      // Credit only. The eye on the clue spends it on the selected word.
      await wallet.refresh({ silent: true });
      startEyeAttention();
    } catch (e) {
      console.warn('[Ad] reward flow failed', e?.message || e);
      if (String(e?.message || '').includes('timeout waiting')) {
        Alert.alert(t('play.ad.failed.title'), t('play.ad.failed.body'));
      } else {
        Alert.alert(t('play.ad.loadFailed.title'), t('play.ad.loadFailed.body'));
      }
    } finally {
      letterBusyRef.current = false;
      setLetterBusy(false);
    }
  }, [
    isOnboarding,
    wallet,
    startEyeAttention,
    t,
  ]);

  const handleCellAd = useCallback(async (row, col) => {
    if (letterBusyRef.current || isOnboarding || Date.now() < adGuardUntilRef.current) return false;
    const key = `${row},${col}`;
    if (!cellAdKeys.has(key)) return false;
    let pick = null;
    Object.entries(wordPositions || {}).some(([word, positions]) => {
      const hit = (positions || []).find((p) => p.row === row && p.col === col && p.letter);
      if (!hit) return false;
      pick = { key, letter: hit.letter, word };
      return true;
    });
    if (!pick?.letter) return false;
    letterBusyRef.current = true;
    setLetterBusy(true);
    setCellAdBusy(true);
    try {
      const earned = await withAdAudioMuted(() => showRewardedCellAd());
      adGuardUntilRef.current = Date.now() + 1600;
      if (!earned) return;
      playSfx('adReward');
      applyRevealedLetters([pick]);
      const word = normalizeWord(pick.word);
      const positions = wordPositions[word] || [];
      const order = positions.map((p) => `${p.row},${p.col}`);
      const at = order.indexOf(pick.key);
      const stillHidden = positions.filter((p) => {
        const key = `${p.row},${p.col}`;
        if (key === pick.key) return false;
        return !displayGrid[p.row]?.[p.col];
      });
      let nextKey = null;
      for (let i = 1; i < order.length; i += 1) {
        const key = order[(at + i) % order.length];
        if (stillHidden.some((p) => `${p.row},${p.col}` === key)) {
          nextKey = key;
          break;
        }
      }
      const startIndex = Math.max(
        0,
        stillHidden.findIndex((p) => `${p.row},${p.col}` === nextKey)
      );
      setCellAdCursor((prev) => ({
        ...prev,
        [word]: { startIndex },
      }));
      setAdHideUntil(failCount + 3);
    } catch (e) {
      if (__DEV__) console.warn('[Ad] cell reveal failed', e);
      Alert.alert(t('play.ad.failed.title'), t('play.ad.failed.body'));
    } finally {
      letterBusyRef.current = false;
      setLetterBusy(false);
      setCellAdBusy(false);
    }
  }, [
    isOnboarding,
    cellAdKeys,
    wordPositions,
    displayGrid,
    failCount,
    playSfx,
    applyRevealedLetters,
    t,
  ]);

  useEffect(() => {
    if (!isOnboarding || onboardingStep !== TUTORIAL_STEP.CELL_AD) return;
    setSelectedWord('LOG');
  }, [isOnboarding, onboardingStep]);

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

  const clueStrip = (
    <View
      ref={onboardingClueWrapRef}
      collapsable={false}
      style={styles.clueStripWrap}
      onLayout={(e) => {
        const { y, height } = e.nativeEvent.layout;
        onboardingClueContentLayoutRef.current = { y, height };
        if (isOnboarding) measureOnboardingFocus();
      }}
    >
      <SwipeableClueStrip
        cardRef={onboardingClueRef}
        text={clueStripText}
        placeholder={clueStripPlaceholder}
        canSwipe={unfoundClues.length > 1 || (isOnboarding && onboardingStep === 0)}
        showSwipeHints={isOnboarding && onboardingStep === 0}
        onSwipe={goClue}
        backgroundColor={ww.clueBg}
        gradientColors={ww.clueGradient}
        borderColor={ww.borderStrong}
        textColor={
          clueStripPlaceholder
            ? ww.textMuted || ww.clueText
            : ww.clueText || ww.text
        }
        prevA11y={t('play.clue.prev')}
        nextA11y={t('play.clue.next')}
        active={Boolean(wheelPreview)}
        overlay={
          wheelPreview ? (
            <View style={styles.wordOverlay}>
              <ClueLetterRow word={wheelPreview} />
            </View>
          ) : null
        }
      />
      {!puzzleComplete && (
        (isOnboarding && onboardingStep === TUTORIAL_STEP.EYE && tutorialCredits > 0)
        || (!isOnboarding && (wallet.creditBalance ?? 0) > 0)
      ) ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.clueLetterIconBtn,
            {
              opacity: eyeFlicker,
              transform: [{ scale: eyeScale }],
            },
          ]}
        >
          {eyeAttention ? (
            <Animated.View pointerEvents="none" style={[styles.eyeAttentionRing, { opacity: eyeGlow }]} />
          ) : null}
          <Pressable
            ref={isOnboarding ? onboardingEyeRef : undefined}
            style={styles.eyeHit}
            onPress={handleShowOneLetter}
            disabled={letterBusy}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('play.letter.show')}
          >
            {letterBusy ? (
              <ActivityIndicator color="#3F2A1A" size="small" />
            ) : (
              <Eye color={eyeAttention ? '#C2410C' : '#3F2A1A'} size={18} strokeWidth={2.4} />
            )}
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );

  const timerRow = timerEnabled ? (
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
  ) : null;

  return (
    <GradientBackground variant="play">
      <View style={styles.shell}>
      <View style={[styles.playBody, isLandscape && styles.playBodyLandscape]}>
      <ScrollView
        ref={onboardingScrollRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: Math.max(insets.top, 12) + 8 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(e) => {
          onboardingScrollYRef.current = e.nativeEvent.contentOffset.y;
          if (isOnboarding) measureOnboardingFocus();
        }}
      >
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
              {isOnboarding
                ? t('onboarding.title')
                : isDaily
                ? dailyLabel
                : journeyLevel != null
                  ? t('common.level', { n: journeyLevel })
                  : t('common.levelFallback')}
            </Text>
          </View>
          <View style={styles.headerRight}>
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
            ) : null}
            {(!isOnboarding || onboardingStep >= TUTORIAL_STEP.CREDIT) ? (
              <Animated.View
                style={{
                  opacity: isOnboarding && onboardingStep === TUTORIAL_STEP.EYE ? creditFlicker : 1,
                }}
              >
              <Pressable
                ref={isOnboarding ? onboardingCreditRef : undefined}
                style={[
                  styles.creditChip,
                  isRandomScene && styles.creditChipOnScene,
                  isDark && styles.creditChipDark,
                ]}
                onPress={() => {
                  if (isOnboarding) return;
                  setCreditSheetOpen(true);
                }}
                accessibilityLabel={t('play.credit.chip')}
              >
                <Sparkles size={15} color={isRandomScene ? '#0b3d36' : isDark ? '#5eead4' : '#7dd3fc'} />
                <Text
                  style={[
                    styles.creditChipText,
                    isRandomScene && styles.creditChipTextOnScene,
                    isDark && styles.creditChipTextDark,
                  ]}
                >
                  {isOnboarding ? tutorialCredits : (wallet.creditBalance ?? 0)}
                </Text>
              </Pressable>
              </Animated.View>
            ) : null}
          </View>
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
          maxBoardSize={gridMaxSize}
          onCellPress={handleCellPress}
          adHintCells={cellAdKeys}
          adHintBusy={cellAdBusy}
          onAdHintPress={handleCellAd}
          onBoardMetrics={
            isOnboarding
              ? (metrics) => {
                  onboardingBoardMetricsRef.current = metrics;
                  measureOnboardingFocus();
                }
              : null
          }
          boardHostRef={isOnboarding ? onboardingGridBoardRef : null}
        />

        {clueStrip}
        {timerRow}
      </ScrollView>

      {/* Wheel stays outside ScrollView so pan gestures are never stolen mid-drag. */}
      <View
        style={[
          styles.wheelDock,
          isLandscape && styles.wheelDockLandscape,
          {
            paddingBottom: isLandscape
              ? 12
              : isOnboarding
                ? Math.max(insets.bottom, 8)
                : 4,
          },
        ]}
      >
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
              {todayGiftCoins > 0 ? (
                <View
                  style={styles.giftTodayRow}
                  accessibilityLabel={t('play.gift.today', { n: todayGiftCoins })}
                >
                  <Gift size={11} color="#fde68a" />
                  <Text style={styles.giftTodayLabel}>+{todayGiftCoins}</Text>
                </View>
              ) : null}
            </View>
            <View
              ref={onboardingHintRef}
              collapsable={false}
              onLayout={isOnboarding ? measureOnboardingFocus : undefined}
            >
              <Pressable
                style={[
                  styles.toolBtn,
                  { backgroundColor: ww.toolBtnBg, borderColor: ww.borderStrong },
                  !canUseHint && styles.toolBtnDisabled,
                ]}
                onPress={() => {
                  setSelectedIndices([]);
                  handleHint();
                }}
                disabled={hintPending}
                accessibilityLabel={t('play.a11y.useHint')}
              >
                {hintPending ? (
                  <ActivityIndicator color={ww.toolIcon} size="small" />
                ) : (
                  <Lightbulb color={ww.toolIcon} size={18} />
                )}
              </Pressable>
            </View>
            <Pressable
              style={[
                styles.toolBtn,
                { backgroundColor: ww.toolBtnBg, borderColor: ww.borderStrong },
              ]}
              onPress={() => {
                setSelectedIndices([]);
                setTreasureOpen(true);
              }}
              accessibilityLabel={t('play.a11y.treasureChest')}
            >
              <PiTreasureChest size={18} color={ww.toolIcon} />
            </Pressable>
          </View>

          <View
            ref={onboardingWheelRef}
            collapsable={false}
            onLayout={isOnboarding ? measureOnboardingFocus : undefined}
          >
            <LetterWheel
              tiles={wheelTiles}
              selectedIndices={selectedIndices}
              onSelectionChange={setSelectedIndices}
              onDragEnd={handleDragEnd}
              onPreviewChange={setWheelPreview}
              onShuffle={applyWheelShuffle}
              shuffleSignal={shuffleSignal}
              wheelSize={wheelSize}
            />
          </View>

          <View style={styles.sideTools}>
            <Pressable
              style={[
                styles.toolBtn,
                { backgroundColor: ww.toolBtnBg, borderColor: ww.borderStrong },
                !selectedWord && styles.toolBtnDisabled,
              ]}
              onPress={() => {
                setSelectedIndices([]);
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
            <Pressable
              style={[styles.toolBtn, { backgroundColor: ww.toolBtnBg, borderColor: ww.borderStrong }]}
              onPress={async () => {
                const next = !soundEnabled;
                await setSoundEnabled(next);
                if (next) playSfx('click');
              }}
              accessibilityRole="button"
              accessibilityLabel={
                soundEnabled ? t('play.a11y.soundOff') : t('play.a11y.soundOn')
              }
            >
              {soundEnabled ? (
                <Volume2 color={ww.toolIcon} size={18} />
              ) : (
                <VolumeX color={ww.toolIcon} size={18} />
              )}
            </Pressable>
          </View>
        </View>
      </View>
      </View>
      {!isOnboarding && !letterBusy ? (
        <View style={styles.playAdSlot}>
          <AdBanner style={[styles.playAdBanner, { paddingBottom: 0 }]} />
        </View>
      ) : null}
      </View>

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
        onShop={handleCompletionShop}
        durationLabel={completionStats?.durationLabel}
        scoreCoins={completionStats?.scoreCoins ?? 0}
        hintCoinsSpent={completionStats?.hintCoinsSpent ?? 0}
        levelNumber={completionStats?.levelNumber}
        forceScreenType={completionStats?.screenType}
        showStarterOffer={showStarterOffer}
      />

      <StarterPackGateModal
        visible={starterGateVisible}
        context={starterGateContext}
        unlockLevel={starterUnlockLevel}
        onClose={() => setStarterGateVisible(false)}
        onShop={handleStarterGateShop}
      />

      <Modal
        visible={creditSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCreditSheetOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setCreditSheetOpen(false)}>
          <Pressable
            style={[
              styles.sheetCard,
              {
                backgroundColor: isDark ? colors.surface : '#ffffff',
                borderColor: isDark ? colors.primary : 'transparent',
              },
            ]}
            onPress={() => {}}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: isDark ? colors.text : '#0f172a' }]}>
                {t('play.credit.sheet.title')}
              </Text>
              <Pressable
                style={styles.sheetClose}
                onPress={() => setCreditSheetOpen(false)}
                hitSlop={8}
                accessibilityLabel={t('play.credit.sheet.close')}
              >
                <X size={20} color={isDark ? colors.text : '#0f172a'} />
              </Pressable>
            </View>
            <View style={styles.sheetBalanceRow}>
              <Sparkles size={18} color="#f59e0b" />
              <Text style={[styles.sheetCount, { color: isDark ? colors.textMuted : '#334155' }]}>
                {t('play.credit.sheet.balance', { n: wallet.creditBalance ?? 0 })}
              </Text>
            </View>
            <View style={styles.bestValueChip}>
              <Text style={styles.bestValueText}>{t('play.credit.sheet.bestValue')}</Text>
            </View>
            <ShopOfferButton
              label={t('play.credit.sheet.buyStarter')}
              accessibilityLabel={t('play.credit.sheet.buyStarter')}
              onPress={() => {
                setCreditSheetOpen(false);
                playSfx('click');
                navigate(SCREENS.SHOP, {
                  backScreen: isDaily ? SCREENS.DAILY_PLAY : SCREENS.PLAY,
                  mode: routeParams.mode,
                  date: routeParams.date,
                });
              }}
            />
            <Pressable
              style={[
                styles.sheetSecondary,
                { borderColor: isDark ? 'rgba(94, 234, 212, 0.45)' : '#cbd5e1' },
              ]}
              onPress={handleWatchAd}
              disabled={letterBusy}
            >
              <Text style={[styles.sheetSecondaryText, { color: isDark ? colors.text : '#0f172a' }]}>
                {t('play.credit.sheet.watchAd')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={coinsAlertOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCoinsAlertOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setCoinsAlertOpen(false)}>
          <Pressable
            style={[
              styles.sheetCard,
              styles.coinsAlertCard,
              {
                backgroundColor: isDark ? colors.surface : '#FFF8EE',
                borderColor: isDark ? colors.primary : '#F5C542',
              },
            ]}
            onPress={() => {}}
          >
            <View style={styles.coinsAlertIcon}>
              <GiTwoCoins size={36} color="#B45309" />
            </View>
            <Text style={[styles.sheetTitle, { color: isDark ? colors.text : '#3A2A1A' }]}>
              {t('play.alert.notEnoughCoins.title')}
            </Text>
            <Text style={[styles.coinsAlertBody, { color: isDark ? colors.textMuted : '#6B5344' }]}>
              {t('play.alert.notEnoughCoins.body', { n: WORD_WHEEL_HINT_COST })}
            </Text>
            <Pressable style={styles.coinsAlertCta} onPress={openCoinShop}>
              <Text style={styles.coinsAlertCtaText}>{t('play.alert.notEnoughCoins.charge')}</Text>
            </Pressable>
            <Pressable
              style={styles.coinsAlertDismiss}
              onPress={() => setCoinsAlertOpen(false)}
              hitSlop={8}
            >
              <Text style={[styles.coinsAlertDismissText, { color: isDark ? colors.textMuted : '#6B5344' }]}>
                {t('play.alert.notEnoughCoins.ok')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Bonus-word discovery popup disabled
      <BonusWordModal
        visible={bonusWordModal.visible}
        word={bonusWordModal.word}
        awardedGift={bonusWordModal.awardedGift}
        giftCoins={bonusWordModal.pendingGift || WORD_WHEEL_BONUS_WORD_GIFT}
        onClose={handleBonusWordClose}
      />
      */}

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
      {isOnboarding && !onboardingWelcomeVisible && !onboardingSuccessVisible ? (
        <OnboardingOverlay
          overlayRef={onboardingOverlayRef}
          step={onboardingStep}
          topInset={insets.top}
          bottomInset={insets.bottom}
          focusRects={onboardingFocusRects}
          t={t}
          onNext={() => {
            playSfx('click');
            if (onboardingStep >= TUTORIAL_STEP.DONE) {
              finishOnboarding();
              return;
            }
            if (onboardingStep === TUTORIAL_STEP.CREDIT) setTutorialCredits(1);
            setOnboardingStep((s) => s + 1);
          }}
          onSkip={() => {
            playSfx('click');
            finishOnboarding();
          }}
        />
      ) : null}
      <OnboardingWelcomeOverlay
        visible={isOnboarding && onboardingWelcomeVisible}
        t={t}
        onSkip={() => {
          playSfx('click');
          finishOnboarding();
        }}
        onStart={() => {
          playSfx('click');
          setOnboardingWelcomeVisible(false);
          setOnboardingStep(0);
          setTimeout(measureOnboardingFocus, 80);
          setTimeout(measureOnboardingFocus, 220);
        }}
      />
      <OnboardingSuccessOverlay
        visible={onboardingSuccessVisible}
        t={t}
        onDone={() => {
          playSfx('whoosh');
          setOnboardingSuccessVisible(false);
          setOnboardingStep(onboardingSuccessNextStepRef.current);
        }}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    // Banner may clip under the fold so clue + wheel stay fully visible.
    overflow: 'hidden',
  },
  playBody: {
    flexGrow: 1,
    flexShrink: 0,
    minHeight: 0,
  },
  playBodyLandscape: {
    flexDirection: 'row',
  },
  playAdSlot: {
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  playAdBanner: {
    paddingTop: 2,
  },
  clueStripWrap: {
    position: 'relative',
    overflow: 'visible',
    zIndex: 3,
  },
  wordOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  clueLetterIconBtn: {
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 6,
    width: 32,
    height: 32,
  },
  eyeHit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1.5,
    borderColor: '#E8943A',
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    elevation: 5,
  },
  eyeAttentionRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#F5C542',
    backgroundColor: 'rgba(245, 197, 66, 0.28)',
  },
  creditChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(8, 20, 30, 0.55)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.45)',
  },
  creditChipOnScene: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: 'transparent',
  },
  creditChipDark: {
    backgroundColor: 'rgba(21, 61, 56, 0.92)',
    borderColor: 'rgba(94, 234, 212, 0.55)',
  },
  creditChipText: {
    color: '#e0f2fe',
    fontWeight: '800',
    fontSize: 15,
  },
  creditChipTextOnScene: {
    color: '#0b3d36',
  },
  creditChipTextDark: {
    color: '#ccfbf1',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    gap: 12,
  },
  sheetHeader: {
    minHeight: 28,
    justifyContent: 'center',
  },
  sheetClose: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  sheetBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sheetCount: {
    fontSize: 16,
    textAlign: 'center',
  },
  bestValueChip: {
    alignSelf: 'center',
    backgroundColor: '#F5C542',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: -4,
  },
  bestValueText: {
    color: '#3A2A1A',
    fontSize: 11,
    fontWeight: '800',
  },
  sheetSecondary: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  sheetSecondaryText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  coinsAlertCard: {
    alignItems: 'center',
    borderWidth: 1.5,
    paddingTop: 28,
  },
  coinsAlertIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5C542',
    marginBottom: 4,
  },
  coinsAlertBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  coinsAlertCta: {
    alignSelf: 'stretch',
    backgroundColor: '#F5C542',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  coinsAlertCtaText: {
    color: '#3A2A1A',
    fontWeight: '800',
    fontSize: 16,
  },
  coinsAlertDismiss: {
    paddingVertical: 4,
  },
  coinsAlertDismissText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  wheelDock: {
    paddingHorizontal: 16,
    paddingTop: 0,
    flexShrink: 0,
    zIndex: 2,
  },
  wheelDockLandscape: {
    justifyContent: 'center',
    paddingLeft: 0,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 38,
    justifyContent: 'flex-end',
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
  giftTodayRow: {
    marginTop: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  giftTodayLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fde68a',
  },
  coinLabelGold: {
    color: '#facc15',
  },
  coinLabelLow: {
    color: '#fecaca',
  },
});
