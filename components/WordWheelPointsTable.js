import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WW } from '../constants/theme';

export default function WordWheelPointsTable({ rows = [], compact = false, loading = false }) {
  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#059669" size="small" />
        </View>
      ) : (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>Letters</Text>
            <Text style={[styles.headerCell, styles.headerRight]}>Coins</Text>
          </View>
          {rows.length === 0 ? (
            <Text style={styles.empty}>Coins catalog unavailable.</Text>
          ) : (
            rows.map((row) => (
              <View key={row.length} style={styles.dataRow}>
                <Text style={styles.dataCell}>{row.length} letters</Text>
                <Text style={[styles.dataCell, styles.coinsCell]}>{row.coins ?? row.points}</Text>
              </View>
            ))
          )}
        </>
      )}
      {!compact && !loading && rows.length > 0 && (
        <Text style={styles.footer}>
          Puzzle score is the sum of coins for every word you find.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 61, 54, 0.14)',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerCell: {
    flex: 1,
    fontWeight: '800',
    color: WW.textOnSurface,
    fontSize: 13,
  },
  headerRight: {
    textAlign: 'right',
  },
  dataRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 61, 54, 0.08)',
  },
  dataCell: {
    flex: 1,
    color: WW.textOnSurface,
    fontSize: 13,
  },
  coinsCell: {
    textAlign: 'right',
    fontWeight: '700',
    color: '#059669',
  },
  empty: {
    padding: 12,
    color: 'rgba(15, 61, 54, 0.65)',
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: 'rgba(15, 61, 54, 0.65)',
    fontSize: 11,
  },
});
