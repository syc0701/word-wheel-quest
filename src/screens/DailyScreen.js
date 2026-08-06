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
import { resolveJourneyLevel, resolvePuzzleWordCount } from '../lib/puzzleLevel';
import {
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

function ymKey(ymd) {
  return String(ymd || '').slice(0, 7);
}

function shiftCalendarMonth(ymd, deltaMonths) {
  const [y0, m0, d0] = ymd.split('-').map(Number);
  let y = y0;
  let m = m0 + deltaMonths;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const day = Math.min(d0, daysInMonth);
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
  const monthLabel = useMemo(
    () =>
      new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    [year, month]
  );

  const setDate = useCallback(
    (ymd) => {
      setSelectedDate(clampYmd(ymd, minYmd, todayYmd));
    },
    [minYmd, todayYmd]
  );

  const shiftMonth = useCallback(
    (delta) => setDate(shiftCalendarMonth(selectedDate, delta)),
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

  const puzzleCompleted = Boolean(puzzle?.completed);
  const puzzleTitle = String(puzzle?.title || '').trim();
  const difficultyLabel = formatDifficulty(puzzle?.difficultyLevel);
  const wordCount = useMemo(
    () => (puzzle?.id ? resolvePuzzleWordCount(puzzle) : 0),
    [puzzle]
  );
  const canGoPrevMonth = ymKey(selectedDate) > ymKey(minYmd);
  const canGoNextMonth = ymKey(selectedDate) < ymKey(todayYmd);
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
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
          <Text style={[styles.kicker, { color: colors.textMuted }, sceneText]}>
            {t('daily.kicker')}
          </Text>
        </View>

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
          <View style={styles.monthNav}>
            <Pressable
              style={[styles.navBtn, !canGoPrevMonth && styles.navBtnDisabled]}
              disabled={!canGoPrevMonth || loading}
              onPress={() => shiftMonth(-1)}
              hitSlop={8}
            >
              <ChevronLeft color={colors.text} size={22} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: colors.text }]}>{monthLabel}</Text>
            <Pressable
              style={[styles.navBtn, !canGoNextMonth && styles.navBtnDisabled]}
              disabled={!canGoNextMonth || loading}
              onPress={() => shiftMonth(1)}
              hitSlop={8}
            >
              <ChevronRight color={colors.text} size={22} />
            </Pressable>
          </View>

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
                  style={[styles.dayCell, cell.disabled && styles.dayCellDisabled]}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      cell.ymd === selectedDate && { backgroundColor: colors.primary },
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
                  </View>
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
            styles.selectedCard,
            { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
          ]}
        >
          <View style={styles.selectedHeader}>
            <Text style={[styles.selectedKicker, { color: colors.textMuted }]}>
              {t('daily.selectedPuzzle')}
            </Text>
            {puzzleCompleted ? (
              <View style={[styles.completedChip, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[styles.completedChipText, { color: colors.success }]}>
                  {t('daily.completed')}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.selectedDate, { color: colors.text }]}>
            {formatDisplayDate(selectedDate)}
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.primaryGlow} style={{ marginTop: 12 }} />
          ) : puzzle ? (
            <View style={styles.puzzleInfo}>
              {difficultyLabel ? (
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
                    {difficultyLabel}
                  </Text>
                </View>
              ) : null}
              <View style={styles.puzzleCopy}>
                {puzzleTitle ? (
                  <Text style={[styles.puzzleTitle, { color: colors.text }]} numberOfLines={2}>
                    {puzzleTitle}
                  </Text>
                ) : null}
                {wordCount > 0 ? (
                  <Text style={[styles.puzzleMeta, { color: colors.textMuted }]}>
                    {t('common.words', { n: wordCount })}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : (
            <Text style={[styles.puzzleMeta, { color: colors.textMuted, marginTop: 10 }]}>
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
          <Text style={styles.primaryBtnText}>
            {puzzleCompleted ? t('daily.replay') : t('common.play')}
          </Text>
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
  scroll: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  monthLabel: {
    flex: 1,
    fontWeight: '700',
    fontSize: 15,
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
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
    includeFontPadding: false,
  },
  selectedCard: {
    alignItems: 'stretch',
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  selectedKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  selectedDate: {
    fontSize: 16,
    fontWeight: '700',
  },
  puzzleInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 12,
  },
  puzzleCopy: {
    flex: 1,
    minWidth: 0,
  },
  puzzleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  puzzleMeta: {
    fontSize: 14,
    marginTop: 4,
  },
  completedChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  completedChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  difficultyChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 2,
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
