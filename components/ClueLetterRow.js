import { StyleSheet, Text, View } from 'react-native';
import { WW } from '../constants/theme';

const CIRCLE_SIZE = 40;

export default function ClueLetterRow({ word = '' }) {
  const letters = word.split('');

  if (letters.length === 0) return null;

  return (
    <View style={styles.row}>
      {letters.map((letter, index) => (
        <View
          key={`${letter}-${index}`}
          style={[
            styles.circle,
            {
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              borderRadius: CIRCLE_SIZE / 2,
            },
          ]}
        >
          <Text style={styles.letter}>{letter}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  circle: {
    backgroundColor: WW.surface,
    borderWidth: 2,
    borderColor: WW.wheelLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 20,
    fontWeight: '800',
    color: WW.wheelLineDark,
  },
});
