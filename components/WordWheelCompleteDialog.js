import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WW } from '../constants/theme';

export default function WordWheelCompleteDialog({
  visible,
  onClose,
  durationLabel,
  coinsEarned,
  hintCoinsSpent = 0,
  totalPuzzleCoins,
  wordCount,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Puzzle complete!</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>{durationLabel || '—'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Coins</Text>
              <Text style={[styles.statValue, styles.coinsValue]}>{coinsEarned ?? 0}</Text>
            </View>
          </View>

          {wordCount != null && (
            <Text style={styles.meta}>
              {wordCount} word{wordCount === 1 ? '' : 's'} found
            </Text>
          )}

          {hintCoinsSpent > 0 && (
            <Text style={styles.metaSmall}>Hints used: −{hintCoinsSpent} coins</Text>
          )}

          {totalPuzzleCoins != null && totalPuzzleCoins > 0 && (
            <Text style={styles.metaSmall}>Lifetime total: {totalPuzzleCoins} coins</Text>
          )}

          <Pressable style={styles.continueBtn} onPress={onClose}>
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: WW.surface,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.18)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(15, 61, 54, 0.65)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: WW.textOnSurface,
  },
  coinsValue: {
    color: '#059669',
  },
  meta: {
    textAlign: 'center',
    color: 'rgba(15, 61, 54, 0.72)',
    fontSize: 14,
    marginBottom: 6,
  },
  metaSmall: {
    textAlign: 'center',
    color: 'rgba(15, 61, 54, 0.65)',
    fontSize: 12,
    marginBottom: 4,
  },
  continueBtn: {
    marginTop: 20,
    backgroundColor: '#059669',
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
