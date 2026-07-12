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
import WordWheelApi from '../lib/api';
import { WORD_WHEEL_DAILY_CALENDAR_MIN, WORD_WHEEL_DAILY_UNLOCK_LEVEL } from '../constants/api';
import { resolveWordWheelGridSize } from '../lib/constants';
import { parseWords } from '../lib/gridReveal';
import { resolveJourneyLevel } from '../lib/puzzleLevel';
import {
  addMontrealCalendarDays,
  clampYmd,
  formatDisplayDate,
  montrealYmdFromDate,
} from '../lib/montrealCalendar';
import { PLAY_MODE, SCREENS } from '../constants/theme';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';

const WEEKDAY_KEYS = [
  'daily.weekday.sun',
  'daily.weekday.mon',
  'daily.weekday.tue',
  'daily.weekday.wed',
  'daily.weekday.thu',
  'daily.weekday.fri',
  'daily.weekday.sat',
];

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
  const { colors, isRandomScene } = useAppearance();
  const t = useT();
  const [accessChecked, setAccessChecked] = useState(false);
  const [dailyAllowed, setDailyAllowed] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await WordWheelApi.fetchNext();
        const level = resolveJourneyLevel(next);
        const allowed = level != null && level >= WORD_WHEEL_DAILY_UNLOCK_LEVEL;
        if (cancelled) return;
        setDailyAllowed(allowed);
        if (!allowed) {
          navigate(SCREENS.HOME);
        }
      } catch {
        if (!cancelled) {
          setDailyAllowed(false);
          navigate(SCREENS.HOME);
        }
      } finally {
        if (!cancelled) setAccessChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

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
    if (!dailyAllowed) return;
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
  }, [selectedDate, t, dailyAllowed]);

  const words = useMemo(() => parseWords(puzzle?.wordsInUse), [puzzle]);
  const gridSize = useMemo(() => resolveWordWheelGridSize(puzzle), [puzzle]);
  const puzzleCompleted = Boolean(puzzle?.completed);
  const isToday = selectedDate === todayYmd;
  const canGoPrev = selectedDate > minYmd;
  const canGoNext = selectedDate < todayYmd;
  const canPlay = Boolean(puzzle?.id) && !loading;

  if (!accessChecked || !dailyAllowed) {
    return (
      <View style={[styles.container, styles.accessGate]}>
        <ActivityIndicator color={colors.primaryGlow} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
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
          {t('daily.subtitle')}
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
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
          ]}
        >
          <Text style={[styles.monthLabel, { color: colors.text }]}>
            {new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            })}
          </Text>
          <View style={styles.weekRow}>
            {WEEKDAY_KEYS.map((key, index) => (
              <Text key={`weekday-${index}`} style={[styles.weekDay, { color: colors.textMuted }]}>
                {t(key)}
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
                    cell.ymd === selectedDate && {
                      backgroundColor: colors.primary,
                      borderRadius: 999,
                    },
                    cell.disabled && styles.dayCellDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color:
                          cell.ymd === selectedDate
                            ? '#fff'
                            : cell.disabled
                              ? colors.textMuted
                              : colors.text,
                      },
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

        <View
          style={[
            styles.card,
            styles.previewCard,
            { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryGlow} style={{ marginVertical: 8 }} />
          ) : puzzle ? (
            <>
              {puzzleCompleted ? (
                <View style={[styles.completedChip, { backgroundColor: colors.surfaceLight }]}>
                  <Text style={[styles.completedChipText, { color: colors.success }]}>
                    {t('daily.completed')}
                  </Text>
                </View>
              ) : null}
              <View style={styles.titleRow}>
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
              <Text style={[styles.puzzleMeta, { color: colors.textMuted }]}>
                {t('daily.meta', { n: words.length, size: gridSize })}
              </Text>
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
          onPress={() =>
            navigate(SCREENS.DAILY_PLAY, { mode: PLAY_MODE.DAILY, date: selectedDate })
          }
        >
          <Play color="#fff" size={18} strokeWidth={2.4} fill="#fff" />
          <Text style={styles.primaryBtnText}>{puzzleCompleted ? t('daily.replay') : t('common.play')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  accessGate: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
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
  monthLabel: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 10,
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
  dayCellDisabled: {
    opacity: 0.45,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewCard: {
    alignItems: 'center',
    minHeight: 96,
    justifyContent: 'center',
  },
  puzzleTitle: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'left',
  },
  puzzleMeta: {
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  completedChipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
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
