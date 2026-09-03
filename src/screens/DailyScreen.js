import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, ChevronLeft, ChevronRight, Play } from 'lucide-react-native';
import PuzzleGrid from '../components/PuzzleGrid';
import StarterPackGateModal from '../components/StarterPackGateModal';
import WordWheelApi from '../lib/api';
import { WORD_WHEEL_DAILY_CALENDAR_MIN } from '../constants/api';
import { FREE_DAILY_PLAYS, STARTER_PACK_PACKAGE_ID } from '../constants/guestAccess';
import { resolveWordWheelGridSize } from '../lib/constants';
import {
  buildCellWordNumbers,
  buildDisplayGrid,
  parseWordPositions,
  puzzleCellKeys,
} from '../lib/gridReveal';
import {
  addMontrealCalendarDays,
  clampYmd,
  formatDisplayDate,
  montrealYmdFromDate,
} from '../lib/montrealCalendar';
import { PLAY_MODE, SCREENS } from '../constants/theme';
import { isLoggedIn } from '../lib/auth';
import {
  canPlayDailyPuzzle,
  getFreeDailyPlaysRemaining,
  hasStarterPackAccess,
  resolveDailyPlayAccess,
} from '../lib/guestStarterPack';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import useWordWheelWallet from '../hooks/useWordWheelWallet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EMPTY_SET = new Set();
const EMPTY_HINT_LETTERS = {};

export default function DailyScreen({ navigate, routeParams = {} }) {
  const { colors, isRandomScene } = useAppearance();
  const t = useT();
  const insets = useSafeAreaInsets();
  const wallet = useWordWheelWallet();

  const sceneText = useMemo(
    () =>
      isRandomScene
        ? {
            color: '#ffffff',
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
          }
        : null,
    [isRandomScene]
  );
  const todayYmd = useMemo(() => montrealYmdFromDate(), []);
  const minYmd = WORD_WHEEL_DAILY_CALENDAR_MIN;

  const [selectedDate, setSelectedDate] = useState(() =>
    clampYmd(routeParams.date || todayYmd, minYmd, todayYmd)
  );

  useEffect(() => {
    if (routeParams.date) {
      setSelectedDate(clampYmd(routeParams.date, minYmd, todayYmd));
    }
  }, [routeParams.date, minYmd, todayYmd]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [puzzle, setPuzzle] = useState(null);
  const [freeDailyLeft, setFreeDailyLeft] = useState(FREE_DAILY_PLAYS);
  const [starterGateVisible, setStarterGateVisible] = useState(false);
  const [starterGateContext, setStarterGateContext] = useState('daily');

  const refreshDailyAccess = useCallback(async () => {
    const left = await getFreeDailyPlaysRemaining();
    setFreeDailyLeft(left);
  }, []);

  useEffect(() => {
    refreshDailyAccess();
  }, [refreshDailyAccess, routeParams.starterUnlockTick]);

  const setDate = useCallback(
    (ymd) => {
      setSelectedDate(clampYmd(ymd, minYmd, todayYmd));
    },
    [minYmd, todayYmd]
  );

  const shiftDay = useCallback(
    (delta) => setDate(addMontrealCalendarDays(selectedDate, delta)),
    [selectedDate, setDate]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      setPuzzle(null);
      try {
        const data = await WordWheelApi.fetchDaily(selectedDate);
        if (cancelled) return;
        if (data?.code === 'NO_DATA') {
          setError(t('daily.error.noData'));
          return;
        }
        setPuzzle(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || t('daily.error.loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, t]);

  const gridSize = useMemo(() => resolveWordWheelGridSize(puzzle), [puzzle]);
  const wordPositions = useMemo(
    () => parseWordPositions(puzzle?.filledCoordinates),
    [puzzle]
  );
  const puzzleCells = useMemo(() => puzzleCellKeys(wordPositions), [wordPositions]);
  const displayGrid = useMemo(
    () => buildDisplayGrid([], wordPositions, EMPTY_HINT_LETTERS, gridSize),
    [wordPositions, gridSize]
  );
  const cellWordNumbers = useMemo(
    () =>
      buildCellWordNumbers(
        puzzle?.filledCoordinates,
        [],
        wordPositions,
        EMPTY_SET,
        displayGrid
      ),
    [puzzle?.filledCoordinates, wordPositions, displayGrid]
  );

  const puzzleCompleted = Boolean(puzzle?.completed);
  const isToday = selectedDate === todayYmd;
  const canGoPrev = selectedDate > minYmd;
  const canGoNext = selectedDate < todayYmd;
  const canPlay = Boolean(puzzle?.id) && !loading;

  const handlePlayDaily = useCallback(async () => {
    if (!canPlay) return;
    const authed = await isLoggedIn();
    const hasStarter = await hasStarterPackAccess();
    const access = await resolveDailyPlayAccess({
      hasStarter,
      loggedIn: authed,
      creditBalance: wallet.creditBalance,
    });
    if (access === 'starter') {
      setStarterGateContext('daily');
      setStarterGateVisible(true);
      return;
    }
    if (access === 'no_credits') {
      setStarterGateContext('credits');
      setStarterGateVisible(true);
      return;
    }
    if (!(await canPlayDailyPuzzle({
      hasStarter,
      loggedIn: authed,
      creditBalance: wallet.creditBalance,
    }))) {
      setStarterGateContext('daily');
      setStarterGateVisible(true);
      return;
    }
    navigate(SCREENS.DAILY_PLAY, { mode: PLAY_MODE.DAILY, date: selectedDate });
  }, [canPlay, navigate, selectedDate, wallet.creditBalance]);

  const handleStarterGateShop = useCallback(() => {
    setStarterGateVisible(false);
    navigate(SCREENS.SHOP, {
      backScreen: SCREENS.DAILY,
      packageId: STARTER_PACK_PACKAGE_ID,
    });
  }, [navigate]);

  const showGrid = Boolean(puzzle?.id) && gridSize > 0 && puzzleCells.size > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <Pressable
          style={[
            styles.backBtn,
            { backgroundColor: isRandomScene ? 'rgba(255,255,255,0.94)' : colors.surface },
          ]}
          onPress={() => navigate(SCREENS.HOME)}
          accessibilityLabel={t('daily.a11y.back')}
        >
          <ArrowLeft color={isRandomScene ? '#0b3d36' : colors.text} size={22} />
        </Pressable>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, { color: colors.textMuted }, sceneText]}>{t('daily.kicker')}</Text>
        <Text style={[styles.title, { color: colors.text }, sceneText]}>{t('daily.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }, sceneText]}>
          {freeDailyLeft > 0
            ? t('daily.subtitleFreePlays', { left: freeDailyLeft, total: FREE_DAILY_PLAYS })
            : t('daily.subtitleCredits')}
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
          ]}
        >
          <View style={styles.dateRow}>
            <Pressable
              style={[
                styles.navBtn,
                { backgroundColor: colors.surfaceLight },
                !canGoPrev && styles.navBtnDisabled,
              ]}
              disabled={!canGoPrev || loading}
              onPress={() => shiftDay(-1)}
            >
              <ChevronLeft color={colors.text} size={22} />
            </Pressable>
            <View style={styles.dateCenter}>
              <Text style={[styles.dateText, { color: colors.text }]}>
                {formatDisplayDate(selectedDate)}
              </Text>
              {isToday ? (
                <View style={[styles.todayChip, { backgroundColor: colors.surfaceLight }]}>
                  <Text style={[styles.todayChipText, { color: colors.primaryGlow }]}>{t('daily.today')}</Text>
                </View>
              ) : null}
            </View>
            <Pressable
              style={[
                styles.navBtn,
                { backgroundColor: colors.surfaceLight },
                !canGoNext && styles.navBtnDisabled,
              ]}
              disabled={!canGoNext || loading}
              onPress={() => shiftDay(1)}
            >
              <ChevronRight color={colors.text} size={22} />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primaryGlow} style={styles.loader} />
          ) : puzzle?.id ? (
            <>
              {puzzleCompleted ? (
                <View style={styles.previewHeader}>
                  <View style={[styles.completedChip, { backgroundColor: colors.surfaceLight }]}>
                    <Text style={[styles.completedChipText, { color: colors.primaryGlow }]}>
                      {t('daily.completed')}
                    </Text>
                  </View>
                </View>
              ) : null}
              {showGrid ? (
                <View style={styles.gridPreview}>
                  <PuzzleGrid
                    gridSize={gridSize}
                    displayGrid={displayGrid}
                    puzzleCells={puzzleCells}
                    cellWordNumbers={cellWordNumbers}
                    selectedWordCells={EMPTY_SET}
                    hintOnlyCells={EMPTY_SET}
                    celebratingCellKeys={EMPTY_SET}
                    onCellPress={() => {}}
                  />
                </View>
              ) : null}
            </>
          ) : (
            <Text style={[styles.puzzleMeta, { color: colors.textMuted }]}>
              {error || t('daily.empty')}
            </Text>
          )}
        </View>

        <Pressable
          style={[
            styles.primaryBtn,
            { backgroundColor: colors.primary },
            !canPlay && styles.primaryBtnDisabled,
          ]}
          disabled={!canPlay}
          onPress={handlePlayDaily}
        >
          <Play color="#fff" size={18} strokeWidth={2.4} fill="#fff" />
          <Text style={styles.primaryBtnText}>{puzzleCompleted ? t('daily.replay') : t('common.play')}</Text>
        </Pressable>
      </ScrollView>

      <StarterPackGateModal
        visible={starterGateVisible}
        context={starterGateContext}
        onClose={() => setStarterGateVisible(false)}
        onShop={handleStarterGateShop}
      />
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
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarSpacer: {
    flex: 1,
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
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 22,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  todayChip: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  todayChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loader: {
    marginVertical: 24,
  },
  previewHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 12,
  },
  puzzleMeta: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  gridPreview: {
    width: '100%',
    alignSelf: 'stretch',
  },
  completedChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  completedChipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  primaryBtn: {
    marginTop: 4,
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
});
