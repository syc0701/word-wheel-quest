import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WW } from '../constants/theme';

const COMPLIMENT_POOL = [
  'Good job!',
  'Nice work!',
  'Well done!',
  'Awesome!',
  'Brilliant!',
  'You nailed it!',
  'Great solve!',
  'Fantastic!',
  'Impressive!',
  'Way to go!',
];

function pickCompliment() {
  return COMPLIMENT_POOL[Math.floor(Math.random() * COMPLIMENT_POOL.length)];
}

export default function WordWheelCompleteDialog({
  visible,
  onClose,
  onNext,
  durationLabel,
  hintCoinsSpent = 0,
}) {
  const [title, setTitle] = useState(COMPLIMENT_POOL[0]);

  useEffect(() => {
    if (visible) setTitle(pickCompliment());
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>{durationLabel || '—'}</Text>
            </View>
          </View>

          {hintCoinsSpent > 0 && (
            <Text style={styles.metaSmall}>Hints used: −{hintCoinsSpent} coins</Text>
          )}

          <View style={styles.actions}>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
            <Pressable style={styles.nextBtn} onPress={onNext || onClose}>
              <Text style={styles.nextText}>Next</Text>
            </Pressable>
          </View>
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
  metaSmall: {
    textAlign: 'center',
    color: 'rgba(15, 61, 54, 0.65)',
    fontSize: 12,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  closeBtn: {
    flex: 1,
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(5, 150, 105, 0.45)',
    backgroundColor: '#fff',
  },
  closeText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
