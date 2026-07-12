import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useT } from '../context/LanguageContext';
import IntermissionCardShell from './intermission/IntermissionCardShell';
import WordMasterCard from './intermission/WordMasterCard';
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
 * Level completion modal — matches Word Master intermission styling.
 */
export default function WordWheelCompleteDialog({
  visible,
  onClose,
  onNext,
  durationLabel,
  hintCoinsSpent = 0,
}) {
  const t = useT();
  const [titleKey, setTitleKey] = useState(COMPLIMENT_KEYS[0]);

  useEffect(() => {
    if (visible) setTitleKey(pickComplimentKey());
  }, [visible]);

  const hasHints = hintCoinsSpent > 0;

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
              <WordMasterCard
                title={t(titleKey)}
                timeCaption={t('complete.stat.time')}
                timeLabel={durationLabel || t('common.emDash')}
                starCaption={hasHints ? t('complete.stat.hints') : undefined}
                starWord={hasHints ? `−${hintCoinsSpent}` : undefined}
              />
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
