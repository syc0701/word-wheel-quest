import { useMemo } from 'react';
import {
  LEVEL_SCREEN_TYPES,
  LevelScreenPolicy,
  MILESTONE_BONUS_COINS,
} from '../lib/LevelScreenPolicy';
import { usePlayTimer } from '../context/PlayTimerContext';
import { useT } from '../context/LanguageContext';
import IntermissionCardShell from './intermission/IntermissionCardShell';
import WordMasterCard from './intermission/WordMasterCard';
import StreaksSparksCard from './intermission/StreaksSparksCard';
import BrainPowerCard from './intermission/BrainPowerCard';

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const pad2 = (n) => String(n).padStart(2, '0');
  if (m <= 0) return `0:${pad2(s)}`;
  if (m < 60) return `${m}:${pad2(s)}`;
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  return `${hrs}:${pad2(rem)}:${pad2(s)}`;
}

/**
 * Policy-driven between-level interstitial with premium teal/gold motion design.
 */
export default function LevelIntermissionManager({
  levelNumber,
  timeSpentSeconds,
  starWord,
  forceScreenType,
  onNextLevel,
}) {
  const t = useT();
  const { timerEnabled } = usePlayTimer();

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

  const level = Number(levelNumber) || 0;
  const streakBonus = MILESTONE_BONUS_COINS[LEVEL_SCREEN_TYPES.STREAK_SPARKS];
  const brainBonus = MILESTONE_BONUS_COINS[LEVEL_SCREEN_TYPES.BRAIN_POWER];

  let body = null;
  if (screenType === LEVEL_SCREEN_TYPES.BRAIN_POWER) {
    body = (
      <BrainPowerCard
        title={t('intermission.brainPower.headline')}
        levelArrow={t('intermission.brainPower.levelArrow', { from: level, to: level + 1 })}
        capacityLabel={t('intermission.brainPower.bonus', { n: brainBonus })}
      />
    );
  } else if (screenType === LEVEL_SCREEN_TYPES.STREAK_SPARKS) {
    body = (
      <StreaksSparksCard
        title={t('intermission.streak.headline')}
        titleColor="#ea580c"
        streakLabel={t('intermission.streak.bonusLabel')}
        multiplierText={t('intermission.streak.bonusCoins', { n: streakBonus })}
      />
    );
  } else if (screenType === LEVEL_SCREEN_TYPES.WORD_MASTER) {
    body = (
      <WordMasterCard
        title={t('intermission.wordMaster.title')}
        message={t('intermission.wordMaster.message')}
        starCaption={t('intermission.wordMaster.starWord')}
        starWord={(starWord || t('common.emDash')).toUpperCase()}
      />
    );
  } else {
    body = (
      <WordMasterCard
        title={t('intermission.levelComplete.headline')}
        timeLabel={timerEnabled ? formatDuration(timeSpentSeconds) : undefined}
        timeCaption={timerEnabled ? t('intermission.wordMaster.timeTaken') : undefined}
        starCaption={t('intermission.wordMaster.starWord')}
        starWord={(starWord || t('common.emDash')).toUpperCase()}
      />
    );
  }

  return (
    <IntermissionCardShell
      continueLabel={t('intermission.continue')}
      continueA11y={t('intermission.a11y.continue')}
      onContinue={onNextLevel}
    >
      {body}
    </IntermissionCardShell>
  );
}
