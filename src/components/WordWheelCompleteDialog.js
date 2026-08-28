import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useT } from '../context/LanguageContext';
import {
  LEVEL_SCREEN_TYPES,
  LevelScreenPolicy,
  MILESTONE_BONUS_COINS,
} from '../lib/LevelScreenPolicy';
import { isPurchasesConfigured } from '../services/purchases';
import IntermissionCardShell from './intermission/IntermissionCardShell';
import WordMasterCard from './intermission/WordMasterCard';
import LevelCompleteCard from './intermission/LevelCompleteCard';
import StreaksSparksCard from './intermission/StreaksSparksCard';
import BrainPowerCard from './intermission/BrainPowerCard';
import ShopOfferButton from './intermission/ShopOfferButton';
import { INTERMISSION } from './intermission/intermissionTheme';


const COMPLIMENT_KEYS = [
  'complete.compliment.goodJob',
  'complete.compliment.niceWork',
  'complete.compliment.wellDone',
  'complete.compliment.awesomeJob',
  'complete.compliment.awesome',
  'complete.compliment.brilliant',
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
  onShop,
  durationLabel: _durationLabel,
  scoreCoins = 0,
  hintCoinsSpent = 0,
  levelNumber,
  forceScreenType,
  unlockedFeature = null,
  showStarterOffer = false,
}) {
  const t = useT();
  const [titleKey, setTitleKey] = useState(COMPLIMENT_KEYS[0]);
  const autoTimerRef = useRef(null);

  const guestUpsell =
    showStarterOffer && isPurchasesConfigured() && typeof onShop === 'function';

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

  const handleShop = useCallback(() => {
    clearAutoTimer();
    onShop?.();
  }, [clearAutoTimer, onShop]);

  useEffect(() => {
    clearAutoTimer();
    if (!visible || guestUpsell) return undefined;
    const advance = onNext || onClose;
    if (!advance) return undefined;
    autoTimerRef.current = setTimeout(() => {
      autoTimerRef.current = null;
      advance();
    }, COMPLETE_DIALOG_AUTO_MS);
    return clearAutoTimer;
  }, [visible, onNext, onClose, clearAutoTimer, guestUpsell]);

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
      />
    );
  } else {
    body = (
      <LevelCompleteCard
        title={t(titleKey)}
        levelLabel={
          level > 0 ? t('complete.levelComplete', { n: level }) : t('intermission.levelComplete.headline')
        }
        hintsLabel={t('complete.hintsUsed', { n: hintCoinsSpent })}
        rewardsLabel={t('complete.rewards', { n: scoreCoins })}
      />
    );
  }

  const footer = guestUpsell ? (
    <View style={styles.linkFooter}>
      <Pressable
        onPress={handleContinue}
        accessibilityRole="link"
        accessibilityLabel={t('complete.next')}
        hitSlop={8}
      >
        <Text style={styles.actionLink}>{t('complete.next')}</Text>
      </Pressable>
    </View>
  ) : undefined;

  const continueLabel =
    screenType === LEVEL_SCREEN_TYPES.LEVEL_COMPLETE
      ? `${t('complete.next').toUpperCase()} →`
      : `${t('complete.next').toUpperCase()} ➔`;

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
            continueLabel={continueLabel}
            continueA11y={t('complete.next')}
            onContinue={handleContinue}
            footer={footer}
            rewardCoins={
              screenType === LEVEL_SCREEN_TYPES.LEVEL_COMPLETE && scoreCoins > 0
                ? scoreCoins
                : null
            }
          >
            {body}
            {guestUpsell ? (
              <ShopOfferButton
                label={t('complete.guest.starterLink')}
                onPress={handleShop}
                accessibilityLabel={t('complete.guest.starterLink')}
              />
            ) : null}
            {unlockedFeature === 'dailyPuzzle' ? (
              <View style={styles.unlockBox}>
                <Text style={styles.unlockTitle}>{t('complete.unlock.dailyPuzzle')}</Text>
                <Text style={styles.unlockBody}>{t('complete.unlock.dailyPuzzle.body')}</Text>
              </View>
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
    backgroundColor: 'rgba(42, 24, 12, 0.58)',
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
  unlockBox: {
    marginTop: 14,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 148, 72, 0.55)',
    backgroundColor: 'rgba(245, 210, 140, 0.22)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  unlockTitle: {
    fontFamily: INTERMISSION.displayBold,
    fontSize: 16,
    fontWeight: '800',
    color: '#8B5A1A',
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
  linkFooter: {
    marginTop: 18,
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  actionLink: {
    fontFamily: INTERMISSION.displayBold,
    fontSize: 15,
    fontWeight: '700',
    color: '#8B4518',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
