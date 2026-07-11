import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '../context/AppearanceContext';

const CIRCLE_SIZE = 40;

export default function ClueLetterRow({ word = '' }) {
  const { ww } = useAppearance();
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
              borderColor: ww.letterSelectedBorder,
            },
          ]}
        >
          <LinearGradient
            colors={ww.letterSelectedGradient}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.letter, { color: ww.letterSelectedText }]}>{letter}</Text>
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
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  letter: {
    fontSize: 20,
    fontWeight: '800',
  },
});
