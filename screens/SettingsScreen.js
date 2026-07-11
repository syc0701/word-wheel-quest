import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { ChevronRight, FileText, LogIn, LogOut, ShoppingBag } from 'lucide-react-native';
import AppearancePicker from '../components/AppearancePicker';
import AudioSettingsCard from '../components/AudioSettingsCard';
import ScreenHeader from '../components/ScreenHeader';
import { useAppearance } from '../context/AppearanceContext';
import { SCREENS } from '../constants/theme';
import { LEGAL_LINKS } from '../constants/store';
import { isLoggedIn } from '../lib/auth';
import { signOutAll } from '../services/cognitoAuth';
import useWordWheelWallet from '../hooks/useWordWheelWallet';

function MenuRow({ icon: Icon, label, subtitle, onPress, colors }) {
  return (
    <Pressable
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
      ]}
      onPress={onPress}
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
      <ChevronRight color={colors.textMuted} size={20} />
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
  const { colors } = useAppearance();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    isLoggedIn().then(setAuthed);
  }, []);

  useEffect(() => {
    if (routeParams.signedIn || routeParams.authTick) {
      isLoggedIn().then(setAuthed);
      wallet.refresh({ silent: true }).catch(() => {});
    }
  }, [routeParams.signedIn, routeParams.authTick, wallet.refresh]);

  const handleSignOut = async () => {
    await signOutAll();
    setAuthed(false);
    wallet.refresh({ silent: true }).catch(() => {});
  };

  const handleSignIn = () => {
    navigate(SCREENS.SIGN_IN, { backScreen: SCREENS.SETTINGS });
  };

  const themed = useMemo(
    () => ({
      sectionTitle: { color: colors.textMuted },
      walletCard: {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceLight,
      },
      walletTitle: { color: colors.text },
      walletHint: { color: colors.textMuted },
      accountCaption: { color: colors.textMuted },
      accountLabel: { color: colors.text },
      appearanceCard: {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceLight,
      },
    }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Settings"
        onBack={() =>
          navigate(backScreen, {
            mode: routeParams.mode,
            date: routeParams.date,
          })
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, themed.sectionTitle]}>Appearance</Text>
        <View style={[styles.appearanceCard, themed.appearanceCard]}>
          <AppearancePicker />
        </View>

        <Text style={[styles.sectionTitle, themed.sectionTitle]}>Sound</Text>
        <AudioSettingsCard />

        <Text style={[styles.sectionTitle, themed.sectionTitle]}>Account</Text>
        {authed || wallet.loggedIn ? (
          <>
            <View style={[styles.walletCard, themed.walletCard]}>
              <Text style={[styles.walletTitle, themed.walletTitle]}>Your balance</Text>
              <BalanceCard
                label="Puzzle coins"
                value={wallet.lifetimePoints}
                loading={wallet.loading}
                colors={colors}
              />
              <BalanceCard
                label="Credits"
                value={wallet.creditBalance}
                loading={wallet.loading}
                suffix=" credits"
                colors={colors}
              />
              <Text style={[styles.walletHint, themed.walletHint]}>
                Hints cost 1 coin per letter (or credits when coins run out).
              </Text>
            </View>
            {wallet.accountLabel ? (
              <View style={styles.accountBlock}>
                <Text style={[styles.accountCaption, themed.accountCaption]}>Signed in as</Text>
                <Text style={[styles.accountLabel, themed.accountLabel]} numberOfLines={2}>
                  {wallet.accountLabel}
                </Text>
              </View>
            ) : null}
            <MenuRow icon={LogOut} label="Sign out" onPress={handleSignOut} colors={colors} />
          </>
        ) : (
          <MenuRow
            icon={LogIn}
            label="Sign in"
            subtitle="Move guest progress to your account"
            onPress={handleSignIn}
            colors={colors}
          />
        )}

        <Text style={[styles.sectionTitle, themed.sectionTitle]}>Shop</Text>
        <MenuRow
          icon={ShoppingBag}
          label="In-app purchases"
          subtitle="Buy coins and bundles"
          onPress={() => navigate(SCREENS.SHOP, { backScreen: SCREENS.SETTINGS })}
          colors={colors}
        />

        <Text style={[styles.sectionTitle, themed.sectionTitle]}>Help & legal</Text>
        {LEGAL_LINKS.map((link) => (
          <MenuRow
            key={link.id}
            icon={FileText}
            label={link.label}
            onPress={() =>
              navigate(SCREENS.WEBVIEW, {
                url: link.url,
                title: link.label,
                backScreen: SCREENS.SETTINGS,
              })
            }
            colors={colors}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
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
  accountBlock: {
    marginBottom: 12,
    marginHorizontal: 4,
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
});
