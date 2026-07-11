import { useMemo } from 'react';
import { LEVEL_SCREEN_TYPES, LevelScreenPolicy } from '../lib/LevelScreenPolicy';
import { useT } from '../context/LanguageContext';
import IntermissionCardShell from './intermission/IntermissionCardShell';
import WordMasterCard from './intermission/WordMasterCard';
import StreaksSparksCard from './intermission/StreaksSparksCard';
import BrainPowerCard from './intermission/BrainPowerCard';

function formatDuration(seconds, t) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m <= 0) return t('intermission.duration.seconds', { n: s });
  return `${m}:${String(s).padStart(2, '0')}`;
}

function streakTitle(sessionStreak, t) {
  const streak = Number(sessionStreak) || 0;
  if (streak >= 9) return { label: t('intermission.streak.unstoppable'), color: '#dc2626' };
  if (streak >= 6) return { label: t('intermission.streak.onFire'), color: '#ea580c' };
  if (streak >= 3) return { label: t('intermission.streak.sparkStreak'), color: '#f59e0b' };
  return { label: t('intermission.streak.speedSpark'), color: '#f97316' };
}

/**
 * Policy-driven between-level interstitial with premium teal/gold motion design.
 */
export default function LevelIntermissionManager({
  levelNumber,
  timeSpentSeconds,
  sessionStreak,
  starWord,
  forceScreenType,
  onNextLevel,
}) {
  const t = useT();

  const screenType = useMemo(() => {
    if (
      forceScreenType === LEVEL_SCREEN_TYPES.WORD_MASTER
      || forceScreenType === LEVEL_SCREEN_TYPES.STREAKS_SPARKS
      || forceScreenType === LEVEL_SCREEN_TYPES.BRAIN_POWER
    ) {
      return forceScreenType;
    }
    return LevelScreenPolicy.determineScreenType({
      levelNumber,
      timeSpentSeconds,
      sessionStreak,
    });
  }, [forceScreenType, levelNumber, timeSpentSeconds, sessionStreak]);

  let body = null;
  if (screenType === LEVEL_SCREEN_TYPES.BRAIN_POWER) {
    const level = Number(levelNumber) || 0;
    body = (
      <BrainPowerCard
        title={t('intermission.brainPower.headline')}
        levelArrow={t('intermission.brainPower.levelArrow', { from: level, to: level + 1 })}
        capacityLabel={t('intermission.brainPower.capacity')}
      />
    );
  } else if (screenType === LEVEL_SCREEN_TYPES.STREAKS_SPARKS) {
    const title = streakTitle(sessionStreak, t);
    const multiplier = Math.max(1, Number(sessionStreak) || 1);
    body = (
      <StreaksSparksCard
        title={title.label}
        titleColor={title.color}
        streakLabel={t('intermission.streak.sessionLabel')}
        multiplierText={t('intermission.streak.multiplier', { n: multiplier })}
      />
    );
  } else {
    body = (
      <WordMasterCard
        title={t('intermission.wordMaster.headline')}
        timeLabel={formatDuration(timeSpentSeconds, t)}
        timeCaption={t('intermission.wordMaster.timeTaken')}
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
