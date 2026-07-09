import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { ChevronRight, FileText, LogIn, LogOut, ShoppingBag } from 'lucide-react-native';
import ScreenHeader from '../components/ScreenHeader';
import { COLORS, SCREENS } from '../constants/theme';
import { LEGAL_LINKS } from '../constants/store';
import { isLoggedIn } from '../lib/auth';
import { signOutAll } from '../services/cognitoAuth';
import useWordWheelWallet from '../hooks/useWordWheelWallet';

function MenuRow({ icon: Icon, label, subtitle, onPress }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Icon color={COLORS.primaryGlow} size={20} strokeWidth={1.8} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <ChevronRight color={COLORS.textMuted} size={20} />
    </Pressable>
  );
}

function BalanceCard({ label, value, loading, suffix = '' }) {
  return (
    <View style={styles.balanceRow}>
      <Text style={styles.balanceLabel}>{label}</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.primaryGlow} size="small" />
      ) : (
        <Text style={styles.balanceValue}>
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
        <Text style={styles.sectionTitle}>Account</Text>
        {authed || wallet.loggedIn ? (
          <>
            <View style={styles.walletCard}>
              <Text style={styles.walletTitle}>Your balance</Text>
              <BalanceCard
                label="Puzzle coins"
                value={wallet.lifetimePoints}
                loading={wallet.loading}
              />
              <BalanceCard
                label="Credits"
                value={wallet.creditBalance}
                loading={wallet.loading}
                suffix=" credits"
              />
              <Text style={styles.walletHint}>
                Hints cost 5 coins (or credits when coins run out).
              </Text>
            </View>
            <MenuRow icon={LogOut} label="Sign out" onPress={handleSignOut} />
          </>
        ) : (
          <MenuRow
            icon={LogIn}
            label="Sign in"
            subtitle="Move guest progress to your account"
            onPress={handleSignIn}
          />
        )}

        <Text style={styles.sectionTitle}>Shop</Text>
        <MenuRow
          icon={ShoppingBag}
          label="In-app purchases"
          subtitle="Buy coins and bundles"
          onPress={() => navigate(SCREENS.SHOP, { backScreen: SCREENS.SETTINGS })}
        />

        <Text style={styles.sectionTitle}>Help & legal</Text>
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
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
  },
  walletCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  walletTitle: {
    color: COLORS.text,
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
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  balanceValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  walletHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
});
