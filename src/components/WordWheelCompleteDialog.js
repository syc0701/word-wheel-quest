import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayTimer } from '../context/PlayTimerContext';
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

/** Auto-advance to next puzzle after this many ms. */
export const COMPLETE_DIALOG_AUTO_MS = 5_000;

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
  unlockedFeature = null,
}) {
  const t = useT();
  const { timerEnabled } = usePlayTimer();
  const [titleKey, setTitleKey] = useState(COMPLIMENT_KEYS[0]);
  const autoTimerRef = useRef(null);

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

  const clearAutoTimer = useCallback(() => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const handleContinue = useCallback(() => {
    clearAutoTimer();
    (onNext || onClose)?.();
  }, [clearAutoTimer, onNext, onClose]);

  const handleClose = useCallback(() => {
    clearAutoTimer();
    onClose?.();
  }, [clearAutoTimer, onClose]);

  useEffect(() => {
    clearAutoTimer();
    if (!visible) return undefined;
    const advance = onNext || onClose;
    if (!advance) return undefined;
    autoTimerRef.current = setTimeout(() => {
      autoTimerRef.current = null;
      advance();
    }, COMPLETE_DIALOG_AUTO_MS);
    return clearAutoTimer;
  }, [visible, onNext, onClose, clearAutoTimer]);

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
        message={t('intermission.wordMaster.message')}
        starCaption={t('complete.stat.score')}
        starWord={scoreLabel}
      />
    );
  } else {
    body = (
      <WordMasterCard
        title={t(titleKey)}
        timeCaption={timerEnabled ? t('complete.stat.time') : undefined}
        timeLabel={timerEnabled ? (durationLabel || t('common.emDash')) : undefined}
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} accessibilityRole="button" />
        <View style={styles.wrap} pointerEvents="box-none">
          <IntermissionCardShell
            continueLabel={`${t('complete.next').toUpperCase()} ➔`}
            continueA11y={t('complete.next')}
            onContinue={handleContinue}
          >
            {body}
            {unlockedFeature === 'dailyPuzzle' ? (
              <View style={styles.unlockBox}>
                <Text style={styles.unlockTitle}>{t('complete.unlock.dailyPuzzle')}</Text>
                <Text style={styles.unlockBody}>{t('complete.unlock.dailyPuzzle.body')}</Text>
              </View>
            ) : null}
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
        </View>
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
    zIndex: 2,
  },
  scoreNote: {
    marginTop: 12,
    fontFamily: INTERMISSION.serif,
    fontSize: 14,
    fontWeight: '600',
    color: INTERMISSION.titleTeal,
    textAlign: 'center',
  },
  unlockBox: {
    marginTop: 14,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(234, 179, 8, 0.55)',
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  unlockTitle: {
    fontFamily: INTERMISSION.serifBold || INTERMISSION.serif,
    fontSize: 16,
    fontWeight: '800',
    color: '#a16207',
    textAlign: 'center',
    marginBottom: 4,
  },
  unlockBody: {
    fontFamily: INTERMISSION.serif,
    fontSize: 13,
    color: INTERMISSION.bodyMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  hintsNote: {
    marginTop: 12,
    fontFamily: INTERMISSION.serif,
    fontSize: 13,
    color: INTERMISSION.bodyMuted,
    textAlign: 'center',
  },
});
