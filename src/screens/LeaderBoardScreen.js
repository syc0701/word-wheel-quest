import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import { ArrowLeft, Calendar, Crown, LogIn, Medal } from 'lucide-react-native';
import AdBanner from '../components/AdBanner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import { SCREENS } from '../constants/theme';
import { isLoggedIn } from '../lib/auth';
import { formatShortDisplayDate, montrealYmdFromDate } from '../lib/montrealCalendar';
import {
  fetchMyWordWheelStanding,
  fetchWordWheelTopStandings,
  updateWordWheelNickname,
} from '../lib/leaderBoardApi';
import { nicknameHasBadWords } from '../lib/nicknameFilter';

const MEDALS = {
  1: { Icon: Crown, fill: '#F5C542', icon: '#7A4B00', glow: '#F5C542', border: '#F5C542' },
  2: { Icon: Medal, fill: '#F1F5F9', icon: '#334155', glow: '#E2E8F0', border: '#E2E8F0' },
  3: { Icon: Medal, fill: '#F0A05A', icon: '#6B2E0A', glow: '#F0A05A', border: '#F0A05A' },
};

function AllTimeRibbon({ label }) {
  return (
    <View style={styles.ribbonWrap}>
      <Svg width={228} height={56} viewBox="0 0 228 56">
        <Defs>
          <SvgLinearGradient id="allTimeRibbonGold" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFF6D8" />
            <Stop offset="0.5" stopColor="#F6D78A" />
            <Stop offset="1" stopColor="#E8B15A" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d="M40 14 C86 6 142 6 188 14 L214 20 L196 28 L214 36 L188 42 C142 50 86 50 40 42 L14 36 L32 28 L14 20 Z"
          fill="url(#allTimeRibbonGold)"
          stroke="#C9892E"
          strokeWidth={1.25}
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={styles.ribbonText}>{label}</Text>
    </View>
  );
}

function RankMark({ rank }) {
  const medal = MEDALS[rank];
  const glow = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    if (!medal) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow, medal]);

  if (!medal) {
    return (
      <View style={styles.rankPlain}>
        <Text style={styles.rankPlainText}>{rank}</Text>
      </View>
    );
  }
  const Icon = medal.Icon;
  return (
    <View style={styles.medalWrap}>
      <Animated.View
        pointerEvents="none"
        style={[styles.medalGlow, { backgroundColor: medal.glow, opacity: glow }]}
      />
      <View style={[styles.medal, { backgroundColor: medal.fill, shadowColor: medal.glow }]}>
        <Icon color={medal.icon} size={20} strokeWidth={2.6} />
      </View>
    </View>
  );
}

function StandingRow({ rank, name, score, mine, last, onEdit, editLabel }) {
  const medal = MEDALS[rank];
  const beat = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!mine) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, { toValue: 1.035, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(beat, { toValue: 1, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(beat, { toValue: 1.02, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(beat, { toValue: 1, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(720),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [beat, mine]);

  const Row = mine ? Animated.View : View;
  return (
    <Row
      style={[
        styles.row,
        medal && styles.rowTop,
        medal && { borderColor: medal.border },
        mine && styles.rowMine,
        !mine && !medal && !last && styles.rowDivider,
        mine && { transform: [{ scale: beat }] },
      ]}
    >
      <RankMark rank={rank} />
      <Pressable
        style={styles.nameWrap}
        onPress={mine ? onEdit : undefined}
        disabled={!mine || !onEdit}
        accessibilityLabel={mine ? editLabel : undefined}
      >
        <Text style={[styles.name, mine && styles.nameMine]} numberOfLines={1}>
          {name}
        </Text>
      </Pressable>
      <View style={[styles.scoreChip, mine && styles.scoreChipMine]}>
        <Text style={styles.score}>{score}</Text>
      </View>
    </Row>
  );
}

export default function LeaderBoardScreen({ navigate }) {
  const { colors, isRandomScene } = useAppearance();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [me, setMe] = useState(null);
  const [signedIn, setSignedIn] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const authed = await isLoggedIn();
      setSignedIn(authed);
      const [top, mine] = await Promise.all([
        fetchWordWheelTopStandings(5),
        authed ? fetchMyWordWheelStanding().catch(() => null) : Promise.resolve(null),
      ]);
      setRows(top);
      setMe(mine);
    } catch (e) {
      setError(e?.message || t('leaderboard.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const todayLabel = formatShortDisplayDate(montrealYmdFromDate());
  const dateColor = isRandomScene ? '#fff' : colors.text;

  const myRank = me?.rank;
  const inTop = myRank != null && rows.some((row) => row.rank === myRank);
  const showMineBelow = Boolean(me) && !inTop;

  const openEdit = useCallback(() => {
    setDraftName(me?.nickname && me.nickname !== 'Player' ? me.nickname : '');
    setNameError('');
    setEditing(true);
  }, [me?.nickname]);

  const saveName = useCallback(async () => {
    const next = draftName.trim().replace(/\s+/g, ' ');
    if (next.length < 3 || next.length > 20 || !/^[A-Za-z0-9_]+(?: [A-Za-z0-9_]+)*$/.test(next)) {
      setNameError(t('leaderboard.editTryAgain'));
      return;
    }
    if (nicknameHasBadWords(next)) {
      setNameError(t('leaderboard.editBadWords'));
      return;
    }
    setNameError('');
    setSavingName(true);
    try {
      await updateWordWheelNickname(next);
      setEditing(false);
      await load();
    } catch (e) {
      Alert.alert(t('leaderboard.editTitle'), e?.message || t('leaderboard.editFailed'));
    } finally {
      setSavingName(false);
    }
  }, [draftName, load, t]);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <Pressable
          style={[
            styles.backBtn,
            { backgroundColor: isRandomScene ? 'rgba(255,255,255,0.94)' : colors.surface },
          ]}
          onPress={() => navigate(SCREENS.HOME)}
          accessibilityLabel={t('leaderboard.a11y.back')}
        >
          <ArrowLeft color={isRandomScene ? '#0b3d36' : colors.text} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: isRandomScene ? '#fff' : colors.text }]}>
          {t('leaderboard.title')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.body}>
          <ActivityIndicator color={colors.primaryGlow} style={styles.loader} />
        </View>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <View style={styles.dateRow}>
            <Calendar color={dateColor} size={16} strokeWidth={2.2} />
            <Text style={[styles.dateText, { color: dateColor }]}>{todayLabel}</Text>
          </View>
          {!signedIn ? (
            <Pressable
              style={[styles.signInRow, { backgroundColor: colors.surface, borderColor: colors.primary }]}
              onPress={() => navigate(SCREENS.SIGN_IN, { backScreen: SCREENS.LEADERBOARD })}
              accessibilityLabel={t('leaderboard.signIn')}
            >
              <LogIn color={colors.primaryGlow} size={18} strokeWidth={2.3} />
              <View style={styles.signInCopy}>
                <Text style={[styles.signInTitle, { color: colors.text }]}>{t('leaderboard.signIn')}</Text>
                <Text style={[styles.signInHint, { color: colors.textMuted }]}>{t('leaderboard.signInHint')}</Text>
              </View>
            </Pressable>
          ) : null}
          <AllTimeRibbon label={t('leaderboard.allTime')} />
          {error ? (
            <Text style={[styles.message, { color: colors.textMuted }]}>{error}</Text>
          ) : rows.length === 0 ? (
            <Text style={[styles.message, { color: colors.textMuted }]}>{t('leaderboard.empty')}</Text>
          ) : (
            <LinearGradient
              colors={['#0F3D38', '#1A7A6D', '#5EEAD4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.board}
            >
              {rows.map((row, index) => (
                <StandingRow
                  key={`${row.rank}-${row.nickname}`}
                  rank={row.rank}
                  name={row.nickname}
                  score={row.score}
                  mine={myRank != null && row.rank === myRank}
                  last={!showMineBelow && index === rows.length - 1}
                  onEdit={openEdit}
                  editLabel={t('leaderboard.editName')}
                />
              ))}
              {showMineBelow ? (
                <View style={styles.mineBlock}>
                  <Text style={styles.mineLabel}>{t('leaderboard.you')}</Text>
                  <StandingRow
                    rank={myRank || '—'}
                    name={me.nickname || t('leaderboard.you')}
                    score={me.score}
                    mine
                    last
                    onEdit={openEdit}
                    editLabel={t('leaderboard.editName')}
                  />
                </View>
              ) : null}
            </LinearGradient>
          )}
        </ScrollView>
      )}
      <AdBanner />
      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <Pressable style={styles.editBackdrop} onPress={() => !savingName && setEditing(false)}>
          <Pressable style={[styles.editCard, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.editTitle, { color: colors.text }]}>{t('leaderboard.editTitle')}</Text>
            <Text style={[styles.editRank, { color: colors.textMuted }]}>
              {myRank != null ? t('leaderboard.editRank', { n: myRank }) : t('leaderboard.unranked')}
            </Text>
            <TextInput
              value={draftName}
              onChangeText={(value) => {
                setDraftName(value);
                if (nameError) setNameError('');
              }}
              autoFocus
              maxLength={20}
              autoCapitalize="words"
              autoCorrect={false}
              placeholder={t('leaderboard.you')}
              placeholderTextColor={colors.textMuted}
              style={[styles.editInput, { color: colors.text, borderColor: colors.surfaceLight }]}
            />
            {nameError ? (
              <Text style={[styles.editHint, { color: '#BE123C' }]}>{nameError}</Text>
            ) : null}
            <Pressable
              style={[styles.editSave, savingName && styles.editSaveBusy]}
              onPress={saveName}
              disabled={savingName}
            >
              <LinearGradient
                colors={['#14B8A6', '#0F766E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.editSaveFill}
              >
                {savingName ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.editSaveText}>{t('leaderboard.editSave')}</Text>
                )}
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.editCancel} onPress={() => setEditing(false)} disabled={savingName}>
              <Text style={[styles.editCancelText, { color: colors.textMuted }]}>{t('leaderboard.editCancel')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
  },
  loader: {
    marginTop: 48,
  },
  body: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '800',
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  signInCopy: {
    flex: 1,
  },
  signInTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  signInHint: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  ribbonWrap: {
    width: 228,
    height: 56,
    alignSelf: 'center',
    marginTop: 2,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonText: {
    position: 'absolute',
    color: '#6B3E08',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  board: {
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#042F2C',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  message: {
    textAlign: 'center',
    marginTop: 28,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 8,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.28)',
  },
  rowTop: {
    borderWidth: 1.5,
    borderRadius: 14,
    marginVertical: 4,
    marginHorizontal: 4,
  },
  rowMine: {
    backgroundColor: 'rgba(245, 197, 66, 0.18)',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F5C542',
    marginVertical: 4,
    marginHorizontal: 4,
  },
  medalWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  medal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  rankPlain: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  rankPlainText: {
    color: '#F8FFFC',
    fontSize: 15,
    fontWeight: '800',
  },
  nameWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  name: {
    flexShrink: 1,
    color: '#F8FFFC',
    fontSize: 16,
    fontWeight: '700',
  },
  nameMine: {
    color: '#FFF7D6',
  },
  scoreChip: {
    minWidth: 42,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(4, 32, 30, 0.45)',
    alignItems: 'center',
  },
  scoreChipMine: {
    backgroundColor: '#042F2C',
  },
  score: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  mineBlock: {
    marginTop: 8,
    paddingTop: 4,
  },
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 24, 28, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  editCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  editRank: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '600',
  },
  editInput: {
    marginTop: 12,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 22,
    fontWeight: '800',
  },
  editHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
  },
  editSave: {
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  editSaveFill: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSaveBusy: {
    opacity: 0.7,
  },
  editSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  editCancel: {
    marginTop: 8,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  mineLabel: {
    color: 'rgba(248, 255, 252, 0.8)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
});
