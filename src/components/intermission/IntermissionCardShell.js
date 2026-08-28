import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GoldFiligree from './GoldFiligree';
import ContinueQuestButton from './ContinueQuestButton';
import { INTERMISSION } from './intermissionTheme';

/** Shared centered cream card with soft gold/orange rim + filigree. */
export default function IntermissionCardShell({
  children,
  continueLabel,
  onContinue,
  continueA11y,
  footer,
  rewardCoins = null,
}) {
  return (
    <View style={styles.shadow}>
      <LinearGradient
        colors={['#E8B86D', '#D4A017', '#C47A2A', '#E8B86D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.rim}
      >
        <LinearGradient
          colors={INTERMISSION.cardBg}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.card}
        >
          <GoldFiligree />
          <View style={styles.content}>{children}</View>
          {footer ?? (
            <ContinueQuestButton
              label={continueLabel}
              onPress={onContinue}
              accessibilityLabel={continueA11y}
              rewardCoins={rewardCoins}
            />
          )}
        </LinearGradient>
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
    shadowOpacity: 0.9,
    shadowRadius: 28,
    elevation: 14,
  },
  rim: {
    borderRadius: 28,
    padding: 2,
  },
  card: {
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
});
