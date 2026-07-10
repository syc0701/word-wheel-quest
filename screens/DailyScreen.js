import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import GradientBackground from '../components/GradientBackground';
import WordWheelApi from '../lib/api';
import { WORD_WHEEL_DAILY_CALENDAR_MIN } from '../constants/api';
import { resolveWordWheelGridSize } from '../lib/constants';
import { parseWords } from '../lib/gridReveal';
import {
  addMontrealCalendarDays,
  clampYmd,
  formatDisplayDate,
  montrealYmdFromDate,
} from '../lib/montrealCalendar';
import { PLAY_MODE, SCREENS, WW } from '../constants/theme';

function formatDifficulty(level) {
  const raw = String(level || '').trim();
  if (!raw) return '';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function buildMonthDays(year, month, minYmd, maxYmd) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startPad = first.getUTCDay();
  const cells = [];

  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    const ymd = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const disabled = ymd < minYmd || ymd > maxYmd;
    cells.push({ day: d, ymd, disabled });
  }
  return cells;
}

export default function DailyScreen({ navigate, routeParams = {} }) {
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

  const [year, month] = selectedDate.split('-').map(Number);
  const monthCells = useMemo(
    () => buildMonthDays(year, month, minYmd, todayYmd),
    [year, month, minYmd, todayYmd]
  );

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
          setError('No puzzle available for this date.');
          return;
        }
        setPuzzle(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load daily puzzle');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const words = useMemo(() => parseWords(puzzle?.wordsInUse), [puzzle]);
  const gridSize = useMemo(() => resolveWordWheelGridSize(puzzle), [puzzle]);
  const puzzleCompleted = Boolean(puzzle?.completed);
  const isToday = selectedDate === todayYmd;
  const canGoPrev = selectedDate > minYmd;
  const canGoNext = selectedDate < todayYmd;

  return (
    <GradientBackground variant="home">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backBtn} onPress={() => navigate(SCREENS.HOME)}>
          <ArrowLeft color={WW.text} size={22} />
        </Pressable>

        <Text style={styles.kicker}>BONUS PUZZLE</Text>
        <Text style={styles.title}>Daily Puzzle</Text>
        <Text style={styles.subtitle}>Pick a date to preview and play that day&apos;s puzzle.</Text>

        <View style={styles.dateCard}>
          <Pressable
            style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
            disabled={!canGoPrev || loading}
            onPress={() => shiftDay(-1)}
          >
            <ChevronLeft color={WW.text} size={22} />
          </Pressable>
          <View style={styles.dateCenter}>
            <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
            {isToday && (
              <View style={styles.todayChip}>
                <Text style={styles.todayChipText}>Today</Text>
              </View>
            )}
          </View>
          <Pressable
            style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
            disabled={!canGoNext || loading}
            onPress={() => shiftDay(1)}
          >
            <ChevronRight color={WW.text} size={22} />
          </Pressable>
        </View>

        <View style={styles.calendarCard}>
          <Text style={styles.monthLabel}>
            {new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            })}
          </Text>
          <View style={styles.weekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, index) => (
              <Text key={`weekday-${index}`} style={styles.weekDay}>
                {d}
              </Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {monthCells.map((cell, idx) =>
              cell ? (
                <Pressable
                  key={cell.ymd}
                  disabled={cell.disabled}
                  onPress={() => setDate(cell.ymd)}
                  style={[
                    styles.dayCell,
                    cell.ymd === selectedDate && styles.dayCellSelected,
                    cell.disabled && styles.dayCellDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      cell.ymd === selectedDate && styles.dayTextSelected,
                      cell.disabled && styles.dayTextDisabled,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </Pressable>
              ) : (
                <View key={`pad-${idx}`} style={styles.dayCell} />
              )
            )}
          </View>
        </View>

        <View style={styles.previewCard}>
          {loading ? (
            <ActivityIndicator color={WW.accent} style={{ marginVertical: 16 }} />
          ) : puzzle ? (
            <>
              {puzzleCompleted ? (
                <View style={styles.completedChip}>
                  <Text style={styles.completedChipText}>Completed</Text>
                </View>
              ) : null}
              <View style={styles.titleRow}>
                {puzzle.difficultyLevel ? (
                  <View style={styles.difficultyChip}>
                    <Text style={styles.difficultyChipText}>
                      {formatDifficulty(puzzle.difficultyLevel)}
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.puzzleTitle} numberOfLines={2}>
                  {puzzle.title}
                </Text>
              </View>
              <Text style={styles.puzzleMeta}>
                {words.length} words · {gridSize}×{gridSize} grid
              </Text>
            </>
          ) : (
            <Text style={styles.puzzleMeta}>{error || 'No puzzle for this date.'}</Text>
          )}
        </View>

        <Pressable
          style={[styles.primaryBtn, (!puzzle?.id || loading) && styles.primaryBtnDisabled]}
          disabled={!puzzle?.id || loading}
          onPress={() => navigate(SCREENS.DAILY_PLAY, { mode: PLAY_MODE.DAILY, date: selectedDate })}
        >
          <Text style={styles.primaryBtnText}>{puzzleCompleted ? 'Replay' : 'Play'}</Text>
        </Pressable>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 32,
  },
  backBtn: {
    alignSelf: 'flex-start',
    padding: 8,
    marginLeft: -8,
    marginBottom: 8,
  },
  kicker: {
    color: WW.accent,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '600',
  },
  title: {
    color: WW.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  subtitle: {
    color: WW.textSecondary,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WW.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: WW.border,
    marginBottom: 12,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: WW.surface,
    borderWidth: 1,
    borderColor: WW.borderStrong,
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
    color: WW.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  todayChip: {
    marginTop: 6,
    backgroundColor: WW.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayChipText: {
    color: WW.successText,
    fontSize: 11,
    fontWeight: '600',
  },
  calendarCard: {
    backgroundColor: WW.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: WW.border,
    marginBottom: 12,
  },
  monthLabel: {
    color: WW.text,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: WW.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: WW.accent,
    borderRadius: 999,
  },
  dayCellDisabled: {
    opacity: 0.35,
  },
  dayText: {
    color: WW.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#fff',
  },
  dayTextDisabled: {
    color: WW.textMuted,
  },
  previewCard: {
    backgroundColor: WW.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: WW.border,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 100,
    justifyContent: 'center',
  },
  puzzleTitle: {
    flexShrink: 1,
    color: WW.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'left',
  },
  puzzleMeta: {
    color: WW.textSecondary,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    maxWidth: '100%',
  },
  completedChip: {
    backgroundColor: WW.successSoft,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  completedChipText: {
    color: WW.successText,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  difficultyChip: {
    backgroundColor: WW.accentSoft,
    borderWidth: 1,
    borderColor: WW.accentRing,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  difficultyChipText: {
    color: WW.accentDark,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  primaryBtn: {
    backgroundColor: WW.accent,
    borderRadius: 14,
    paddingVertical: 14,
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
});
