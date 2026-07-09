import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { ChevronRight, FileText, ShoppingBag } from 'lucide-react-native';
import ScreenHeader from '../components/ScreenHeader';
import { COLORS, SCREENS } from '../constants/theme';
import { LEGAL_LINKS } from '../constants/store';

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

export default function SettingsScreen({ navigate }) {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" onBack={() => navigate(SCREENS.WORD_WHEEL)} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Shop</Text>
        <MenuRow
          icon={ShoppingBag}
          label="In-app purchases"
          subtitle="Buy coins and bundles"
          onPress={() => navigate(SCREENS.SHOP)}
        />

        <Text style={styles.sectionTitle}>Help & legal</Text>
        {LEGAL_LINKS.map((link) => (
          <MenuRow
            key={link.id}
            icon={FileText}
            label={link.label}
            onPress={() => navigate(SCREENS.WEBVIEW, { url: link.url, title: link.label })}
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
