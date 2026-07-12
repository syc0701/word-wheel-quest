import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useT } from '../context/LanguageContext';
import {
  LEVEL_SCREEN_TYPES,
  LevelScreenPolicy,
  MILESTONE_BONUS_COINS,
} from '../lib/LevelScreenPolicy';
import IntermissionCardShell from './intermission/IntermissionCardShell';
import WordMasterCard from './intermission/WordMasterCard';
import StreaksSparksCard from './intermission/StreaksSparksCard';
import BrainPowerCard from './intermission/BrainPowerCard';
import { INTERMISSION } from './intermission/intermissionTheme';

const COMPLIMENT_KEYS = [
  'complete.compliment.goodJob',
  'complete.compliment.niceWork',
  'complete.compliment.wellDone',
  'complete.compliment.awesome',
  'complete.compliment.brilliant',
  'complete.compliment.youNailedIt',
  'complete.compliment.greatSolve',
  'complete.compliment.fantastic',
  'complete.compliment.impressive',
  'complete.compliment.wayToGo',
];

function pickComplimentKey() {
  return COMPLIMENT_KEYS[Math.floor(Math.random() * COMPLIMENT_KEYS.length)];
}

/**
 * Level completion modal — popup type + coin bonus from journey level policy.
 */
export default function WordWheelCompleteDialog({
  visible,
  onClose,
  onNext,
  durationLabel,
  scoreCoins = 0,
  hintCoinsSpent = 0,
  levelNumber,
  forceScreenType,
}) {
  const t = useT();
  const [titleKey, setTitleKey] = useState(COMPLIMENT_KEYS[0]);

  const screenType = useMemo(() => {
    if (
      forceScreenType === LEVEL_SCREEN_TYPES.WORD_MASTER
      || forceScreenType === LEVEL_SCREEN_TYPES.STREAK_SPARKS
      || forceScreenType === LEVEL_SCREEN_TYPES.BRAIN_POWER
      || forceScreenType === LEVEL_SCREEN_TYPES.LEVEL_COMPLETE
    ) {
      return forceScreenType;
    }
    return LevelScreenPolicy.determineScreenType({ levelNumber });
  }, [forceScreenType, levelNumber]);

  useEffect(() => {
    if (visible && screenType === LEVEL_SCREEN_TYPES.LEVEL_COMPLETE) {
      setTitleKey(pickComplimentKey());
    }
  }, [visible, screenType]);

  const hasScore = Number(scoreCoins) > 0;
  const hasHints = hintCoinsSpent > 0;
  const scoreLabel = hasScore ? `+${scoreCoins}` : t('common.emDash');
  const level = Number(levelNumber) || 0;
  const streakBonus = MILESTONE_BONUS_COINS[LEVEL_SCREEN_TYPES.STREAK_SPARKS];
  const brainBonus = MILESTONE_BONUS_COINS[LEVEL_SCREEN_TYPES.BRAIN_POWER];

  let body = null;
  if (screenType === LEVEL_SCREEN_TYPES.STREAK_SPARKS) {
    body = (
      <StreaksSparksCard
        title={t('intermission.streak.headline')}
        titleColor="#ea580c"
        streakLabel={t('intermission.streak.bonusLabel')}
        multiplierText={t('intermission.streak.bonusCoins', { n: streakBonus })}
      />
    );
  } else if (screenType === LEVEL_SCREEN_TYPES.BRAIN_POWER) {
    body = (
      <BrainPowerCard
        title={t('intermission.brainPower.headline')}
        levelArrow={t('intermission.brainPower.levelArrow', {
          from: level,
          to: level + 1,
        })}
        capacityLabel={t('intermission.brainPower.bonus', { n: brainBonus })}
      />
    );
  } else if (screenType === LEVEL_SCREEN_TYPES.WORD_MASTER) {
    body = (
      <WordMasterCard
        title={t('intermission.wordMaster.title')}
        timeCaption={t('complete.stat.time')}
        timeLabel={durationLabel || t('common.emDash')}
        starCaption={t('complete.stat.score')}
        starWord={scoreLabel}
      />
    );
  } else {
    body = (
      <WordMasterCard
        title={t(titleKey)}
        timeCaption={t('complete.stat.time')}
        timeLabel={durationLabel || t('common.emDash')}
        starCaption={t('complete.stat.score')}
        starWord={scoreLabel}
      />
    );
  }

  const showScoreHint =
    (screenType === LEVEL_SCREEN_TYPES.STREAK_SPARKS
      || screenType === LEVEL_SCREEN_TYPES.BRAIN_POWER)
    && hasScore;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {visible ? (
          <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
            <IntermissionCardShell
              continueLabel={`${t('complete.next').toUpperCase()} ➔`}
              continueA11y={t('complete.next')}
              onContinue={onNext || onClose}
            >
              {body}
              {showScoreHint ? (
                <Text style={styles.scoreNote}>
                  {t('complete.stat.score')}: {scoreLabel}
                </Text>
              ) : null}
              {hasHints ? (
                <Text style={styles.hintsNote}>
                  {t('complete.hintsUsed', { n: hintCoinsSpent })}
                </Text>
              ) : null}
            </IntermissionCardShell>

            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('complete.close')}
            >
              <Text style={styles.closeText}>{t('complete.close')}</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 28, 34, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  wrap: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  scoreNote: {
    marginTop: 12,
    fontFamily: INTERMISSION.serif,
    fontSize: 14,
    fontWeight: '600',
    color: INTERMISSION.titleTeal,
    textAlign: 'center',
  },
  hintsNote: {
    marginTop: 12,
    fontFamily: INTERMISSION.serif,
    fontSize: 13,
    color: INTERMISSION.bodyMuted,
    textAlign: 'center',
  },
  closeBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeText: {
    fontFamily: INTERMISSION.serif,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 248, 230, 0.92)',
    letterSpacing: 0.4,
    textDecorationLine: 'underline',
  },
});
