import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { ChevronRight, Crown, FileText, Flame, LogIn, LogOut, PartyPopper, RotateCcw, Star, Trophy } from 'lucide-react-native';
import AppearancePicker from '../components/AppearancePicker';
import AudioSettingsCard from '../components/AudioSettingsCard';
import PlayTimerSettingsCard from '../components/PlayTimerSettingsCard';
// import LanguagePicker from '../components/LanguagePicker';
import ScreenHeader from '../components/ScreenHeader';
import WordWheelCompleteDialog from '../components/WordWheelCompleteDialog';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import { SCREENS } from '../constants/theme';
import { LEGAL_LINKS } from '../constants/store';
import { LEVEL_SCREEN_TYPES } from '../lib/LevelScreenPolicy';
import { isLoggedIn } from '../lib/auth';
import { fetchMyWordWheelStanding } from '../lib/leaderBoardApi';
import { signOutAll } from '../services/cognitoAuth';
import { restorePurchases } from '../services/purchases';
import useWordWheelWallet from '../hooks/useWordWheelWallet';

const DEV_INTERMISSION_LINKS = [
  {
    id: LEVEL_SCREEN_TYPES.WORD_MASTER,
    icon: Star,
    labelKey: 'settings.dev.wordMaster',
    subtitleKey: 'settings.dev.wordMaster.subtitle',
  },
  {
    id: LEVEL_SCREEN_TYPES.STREAK_SPARKS,
    icon: Flame,
    labelKey: 'settings.dev.streaksSparks',
    subtitleKey: 'settings.dev.streaksSparks.subtitle',
  },
  {
    id: LEVEL_SCREEN_TYPES.BRAIN_POWER,
    icon: Crown,
    labelKey: 'settings.dev.brainPower',
    subtitleKey: 'settings.dev.brainPower.subtitle',
  },
];

function MenuRow({ icon: Icon, label, subtitle, onPress, colors, embedded = false, loading = false }) {
  return (
    <Pressable
      style={[
        embedded ? styles.rowEmbedded : styles.row,
        !embedded && {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceLight,
        },
      ]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.surfaceLight }]}>
        <Icon color={colors.primaryGlow} size={20} strokeWidth={1.8} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primaryGlow} size="small" />
      ) : (
        <ChevronRight color={colors.textMuted} size={20} />
      )}
    </Pressable>
  );
}

function BalanceCard({ label, value, loading, suffix = '', colors }) {
  return (
    <View style={styles.balanceRow}>
      <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>{label}</Text>
      {loading ? (
        <ActivityIndicator color={colors.primaryGlow} size="small" />
      ) : (
        <Text style={[styles.balanceValue, { color: colors.text }]}>
          {value}
          {suffix}
        </Text>
      )}
    </View>
  );
}

export default function SettingsScreen({ navigate, routeParams = {} }) {
  const backScreen = routeParams.backScreen ?? SCREENS.PLAY;
  const wallet = useWordWheelWallet();
  const { colors, isRandomScene } = useAppearance();
  const t = useT();
  const [authed, setAuthed] = useState(false);
  const [completePreviewVisible, setCompletePreviewVisible] = useState(false);
  const [scoreStanding, setScoreStanding] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [restoringPurchases, setRestoringPurchases] = useState(false);

  const refreshScore = async (isAuthed) => {
    if (!isAuthed) {
      setScoreStanding(null);
      setScoreLoading(false);
      return;
    }
    setScoreLoading(true);
    try {
      const standing = await fetchMyWordWheelStanding();
      setScoreStanding(standing);
    } catch {
      setScoreStanding(null);
    } finally {
      setScoreLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn().then((v) => {
      setAuthed(v);
      refreshScore(v);
    });
  }, []);

  useEffect(() => {
    if (routeParams.signedIn || routeParams.authTick) {
      isLoggedIn().then((v) => {
        setAuthed(v);
        wallet.refresh({ silent: true }).catch(() => {});
        refreshScore(v);
      });
    }
  }, [routeParams.signedIn, routeParams.authTick, wallet.refresh]);

  const handleSignOut = async () => {
    await signOutAll();
    setAuthed(false);
    setScoreStanding(null);
    wallet.refresh({ silent: true }).catch(() => {});
  };

  const handleSignIn = () => {
    navigate(SCREENS.SIGN_IN, { backScreen: SCREENS.SETTINGS });
  };

  const handleRestorePurchases = async () => {
    setRestoringPurchases(true);
    try {
      await restorePurchases();
      Alert.alert(t('shop.alert.restored.title'), t('shop.alert.restored.body'));
    } catch (error) {
      Alert.alert(
        t('shop.alert.restoreFailed.title'),
        error.message ?? t('shop.alert.restoreFailed.body')
      );
    } finally {
      setRestoringPurchases(false);
    }
  };

  const themed = useMemo(
    () => ({
      sectionTitle: isRandomScene
        ? {
            color: '#ffffff',
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(6, 32, 38, 0.62)',
            overflow: 'hidden',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
            textShadowColor: 'rgba(0, 0, 0, 0.45)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }
        : { color: colors.textMuted },
      walletCard: {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceLight,
      },
      walletTitle: { color: colors.text },
      walletHint: { color: colors.textMuted },
      accountCaption: {
        color: isRandomScene ? '#0b3d36' : colors.textMuted,
        ...(isRandomScene
          ? {
              alignSelf: 'flex-start',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              overflow: 'hidden',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }
          : null),
      },
      accountLabel: {
        color: isRandomScene ? '#0b3d36' : colors.text,
        ...(isRandomScene
          ? {
              alignSelf: 'flex-start',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              overflow: 'hidden',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 6,
              marginTop: 4,
            }
          : null),
      },
      appearanceCard: {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceLight,
      },
      appearanceHint: isRandomScene
        ? {
            color: '#0b3d36',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            overflow: 'hidden',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginTop: 8,
            marginBottom: 4,
          }
        : { color: colors.textMuted },
    }),
    [colors, isRandomScene]
  );

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <ScreenHeader
        title={t('settings.title')}
        onBack={() =>
          navigate(backScreen, {
            mode: routeParams.mode,
            date: routeParams.date,
          })
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, themed.sectionTitle]}>{t('settings.section.account')}</Text>
        <View style={[styles.groupCard, themed.walletCard]}>
          {authed || wallet.loggedIn ? (
            <>
              <View style={styles.accountSection}>
              <Text style={[styles.walletTitle, themed.walletTitle]}>{t('settings.wallet.title')}</Text>
              <BalanceCard
                label={t('settings.wallet.puzzleCoins')}
                value={wallet.lifetimePoints}
                loading={wallet.loading}
                colors={colors}
              />
              <BalanceCard
                label={t('settings.wallet.credits')}
                value={wallet.creditBalance}
                loading={wallet.loading}
                suffix={t('settings.wallet.creditsSuffix')}
                colors={colors}
              />
              <Text style={[styles.walletHint, themed.walletHint]}>
                {t('settings.wallet.hint')}
              </Text>
              </View>

              <View style={[styles.groupDivider, { backgroundColor: colors.surfaceLight }]} />
              <View style={styles.accountSection}>
                <View style={styles.scoreHeader}>
                  <Trophy color={colors.primaryGlow} size={18} strokeWidth={1.8} />
                  <Text style={[styles.walletTitle, themed.walletTitle, styles.scoreTitle]}>
                    {t('settings.section.score')}
                  </Text>
                </View>
                <BalanceCard
                  label={t('settings.score.wordsFound')}
                  value={scoreStanding?.wordsFound ?? 0}
                  loading={scoreLoading}
                  colors={colors}
                />
                <BalanceCard
                  label={t('settings.score.rank')}
                  value={
                    scoreStanding?.rank != null
                      ? t('settings.score.rankValue', { n: scoreStanding.rank })
                      : t('common.emDash')
                  }
                  loading={scoreLoading}
                  colors={colors}
                />
                <Text style={[styles.walletHint, themed.walletHint]}>
                  {scoreStanding?.wordsFound
                    ? t('settings.score.hint')
                    : t('settings.score.empty')}
                </Text>
              </View>

              {wallet.accountLabel ? (
                <>
                  <View style={[styles.groupDivider, { backgroundColor: colors.surfaceLight }]} />
                  <View style={[styles.accountBlock, styles.accountSection]}>
                <Text style={[styles.accountCaption, themed.accountCaption]}>{t('settings.account.signedInAs')}</Text>
                <Text style={[styles.accountLabel, themed.accountLabel]} numberOfLines={2}>
                  {wallet.accountLabel}
                </Text>
                  </View>
                </>
              ) : null}
              <View style={[styles.groupDivider, { backgroundColor: colors.surfaceLight }]} />
              <MenuRow
                icon={LogOut}
                label={t('settings.account.signOut')}
                onPress={handleSignOut}
                colors={colors}
                embedded
              />
            </>
          ) : (
            <>
              <MenuRow
                icon={LogIn}
                label={t('settings.account.signIn')}
                subtitle={t('settings.account.signInSubtitle')}
                onPress={handleSignIn}
                colors={colors}
                embedded
              />
              <View style={[styles.groupDivider, { backgroundColor: colors.surfaceLight }]} />
              <Text style={[styles.signedOutScoreHint, themed.walletHint]}>
                {t('settings.score.signInHint')}
              </Text>
            </>
          )}
          <View style={[styles.groupDivider, { backgroundColor: colors.surfaceLight }]} />
          <MenuRow
            icon={RotateCcw}
            label={t('shop.restore')}
            subtitle={t('shop.restore.subtitle')}
            onPress={handleRestorePurchases}
            colors={colors}
            embedded
            loading={restoringPurchases}
          />
        </View>

        <Text style={[styles.sectionTitle, themed.sectionTitle]}>{t('settings.section.preferences')}</Text>
        <View style={[styles.preferencesCard, themed.appearanceCard]}>
          <AppearancePicker />
          {isRandomScene ? (
            <Text style={[styles.appearanceHint, themed.appearanceHint]}>
              {t('settings.appearance.randomHint')}
            </Text>
          ) : null}
          <View style={[styles.preferenceDivider, { backgroundColor: colors.surfaceLight }]} />
          <AudioSettingsCard />
          <View style={[styles.preferenceDivider, { backgroundColor: colors.surfaceLight }]} />
          <PlayTimerSettingsCard />
        </View>

        {/* Language picker — re-enable when shipping multi-language UI
        <Text style={[styles.sectionTitle, themed.sectionTitle]}>{t('settings.section.language')}</Text>
        <View style={[styles.appearanceCard, themed.appearanceCard]}>
          <LanguagePicker />
        </View>
        */}

        <Text style={[styles.sectionTitle, themed.sectionTitle]}>{t('settings.section.legal')}</Text>
        <View style={[styles.groupCard, themed.walletCard]}>
          {LEGAL_LINKS.map((link, index) => (
            <View key={link.id}>
              {index > 0 ? (
                <View style={[styles.groupDivider, { backgroundColor: colors.surfaceLight }]} />
              ) : null}
              <MenuRow
                icon={FileText}
                label={t(link.labelKey)}
                onPress={() =>
                  navigate(SCREENS.WEBVIEW, {
                    url: link.url,
                    title: t(link.labelKey),
                    backScreen: SCREENS.SETTINGS,
                  })
                }
                colors={colors}
                embedded
              />
            </View>
          ))}
        </View>

        {__DEV__ ? (
          <>
            <Text style={[styles.sectionTitle, themed.sectionTitle]}>{t('settings.section.developer')}</Text>
            <Text
              style={[
                styles.devHint,
                isRandomScene
                  ? {
                      color: '#0b3d36',
                      backgroundColor: 'rgba(255,255,255,0.92)',
                      borderRadius: 10,
                      overflow: 'hidden',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }
                  : { color: colors.textMuted },
              ]}
            >
              {t('settings.dev.hint')}
            </Text>
            <View style={[styles.groupCard, themed.walletCard]}>
              {DEV_INTERMISSION_LINKS.map((link, index) => (
                <View key={link.id}>
                  {index > 0 ? (
                    <View style={[styles.groupDivider, { backgroundColor: colors.surfaceLight }]} />
                  ) : null}
                  <MenuRow
                    icon={link.icon}
                    label={t(link.labelKey)}
                    subtitle={t(link.subtitleKey)}
                    onPress={() =>
                      navigate(SCREENS.DEV_INTERMISSION, {
                        previewType: link.id,
                        backScreen: SCREENS.SETTINGS,
                      })
                    }
                    colors={colors}
                    embedded
                  />
                </View>
              ))}
              <View style={[styles.groupDivider, { backgroundColor: colors.surfaceLight }]} />
              <MenuRow
                icon={PartyPopper}
                label={t('settings.dev.completeDialog')}
                subtitle={t('settings.dev.completeDialog.subtitle')}
                onPress={() => setCompletePreviewVisible(true)}
                colors={colors}
                embedded
              />
            </View>
          </>
        ) : null}
      </ScrollView>

      {__DEV__ ? (
        <WordWheelCompleteDialog
          visible={completePreviewVisible}
          durationLabel="0:42"
          scoreCoins={42}
          hintCoinsSpent={2}
          onClose={() => setCompletePreviewVisible(false)}
          onNext={() => setCompletePreviewVisible(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
  },
  appearanceCard: {
    borderRadius: 14,
    padding: 10,
    marginBottom: 4,
    borderWidth: 1,
  },
  preferencesCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    marginBottom: 4,
    borderWidth: 1,
  },
  appearanceHint: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 4,
    marginHorizontal: 2,
  },
  preferenceDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  walletCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  walletTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  scoreTitle: {
    marginBottom: 0,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  walletHint: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  accountSection: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  signedOutScoreHint: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  accountBlock: {
    marginHorizontal: 0,
  },
  accountCaption: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountLabel: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  groupCard: {
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 10,
  },
  rowEmbedded: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  devHint: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
    marginHorizontal: 2,
  },
});
