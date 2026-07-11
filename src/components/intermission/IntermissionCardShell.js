import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GoldFiligree from './GoldFiligree';
import ContinueQuestButton from './ContinueQuestButton';
import { INTERMISSION } from './intermissionTheme';

/** Shared centered glass card with gold rim + filigree. */
export default function IntermissionCardShell({ children, continueLabel, onContinue, continueA11y }) {
  return (
    <View style={styles.shadow}>
      <LinearGradient
        colors={INTERMISSION.cardBg}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.card}
      >
        <GoldFiligree />
        <View style={styles.content}>{children}</View>
        <ContinueQuestButton
          label={continueLabel}
          onPress={onContinue}
          accessibilityLabel={continueA11y}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    shadowColor: INTERMISSION.cardGlow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.85,
    shadowRadius: 28,
    elevation: 14,
  },
  card: {
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    borderWidth: 1.5,
    borderColor: INTERMISSION.cardBorder,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
});
