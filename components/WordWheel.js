import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import Svg, { Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { ArrowLeft, CheckCircle2, Settings } from 'lucide-react-native';
import { COLORS, SCREENS } from '../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Mock level data (playable immediately, no backend) ─────────────────────
const LEVELS = [
  {
    letters: ['W', 'O', 'R', 'D', 'S'],
    validWords: ['WORD', 'WORDS', 'ROW', 'SWORD', 'ROD', 'SOW', 'SOD'],
  },
  {
    letters: ['P', 'L', 'A', 'Y', 'S'],
    validWords: ['PLAY', 'PLAYS', 'SAY', 'SLAP', 'LAY', 'SAP', 'SPY'],
  },
  {
    letters: ['G', 'A', 'M', 'E', 'S'],
    validWords: ['GAME', 'GAMES', 'SAGE', 'MEGA', 'GEM', 'SAG', 'SEA'],
  },
];

const WHEEL_RADIUS = Math.min(SCREEN_W * 0.34, 150);
const LETTER_RADIUS = 28;
const HIT_RADIUS = 38;
const WHEEL_CX = SCREEN_W / 2;
const WHEEL_CY = WHEEL_RADIUS + 48;

/**
 * Distribute letters evenly on a circle using trigonometry.
 * angle = (2π / n) * index − π/2  →  top letter at 12 o'clock.
 */
function getLetterPositions(letters) {
  const count = letters.length;
  return letters.map((letter, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;
    return {
      letter,
      index,
      x: WHEEL_CX + WHEEL_RADIUS * Math.cos(angle),
      y: WHEEL_CY + WHEEL_RADIUS * Math.sin(angle),
    };
  });
}

function findLetterAtPoint(positions, x, y) {
  for (let i = 0; i < positions.length; i += 1) {
    const dx = x - positions[i].x;
    const dy = y - positions[i].y;
    if (Math.sqrt(dx * dx + dy * dy) <= HIT_RADIUS) {
      return positions[i];
    }
  }
  return null;
}

/** Burst particles shown when a valid word is found. */
function SuccessBurst({ visible }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        angle: (2 * Math.PI * i) / 8,
      })),
    []
  );

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <BurstParticle key={p.id} angle={p.angle} />
      ))}
    </View>
  );
}

function BurstParticle({ angle }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 600 });
  }, [progress]);

  const style = useAnimatedStyle(() => {
    const dist = progress.value * 50;
    return {
      opacity: 1 - progress.value,
      transform: [
        { translateX: Math.cos(angle) * dist },
        { translateY: Math.sin(angle) * dist },
        { scale: 1 - progress.value * 0.5 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: '40%',
          left: '50%',
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: COLORS.particle,
          marginLeft: -5,
          marginTop: -5,
        },
        style,
      ]}
    />
  );
}

export default function WordWheel({ navigate }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [showBurst, setShowBurst] = useState(false);
  const [linePoints, setLinePoints] = useState([]);

  const previewScale = useSharedValue(1);
  const level = LEVELS[levelIndex];
  const positions = useMemo(() => getLetterPositions(level.letters), [level.letters]);

  const previewStyle = useAnimatedStyle(() => ({
    transform: [{ scale: previewScale.value }],
  }));

  const triggerBurst = useCallback(() => {
    setShowBurst(true);
    previewScale.value = withSequence(
      withSpring(1.12, { damping: 6, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    setTimeout(() => setShowBurst(false), 650);
  }, [previewScale]);

  const resetSelection = useCallback(() => {
    setSelectedIndices([]);
    setCurrentWord('');
    setLinePoints([]);
  }, []);

  const addLetterToPath = useCallback(
    (letterPos) => {
      setSelectedIndices((prev) => {
        if (prev.includes(letterPos.index)) return prev;
        const next = [...prev, letterPos.index];
        const word = next.map((i) => level.letters[i]).join('');
        setCurrentWord(word);
        setLinePoints(next.map((i) => ({ x: positions[i].x, y: positions[i].y })));
        return next;
      });
    },
    [level.letters, positions]
  );

  const validateWord = useCallback(
    (word) => {
      const upper = word.toUpperCase();
      if (upper.length < 2) {
        resetSelection();
        return;
      }
      if (level.validWords.includes(upper) && !foundWords.includes(upper)) {
        setFoundWords((prev) => [...prev, upper]);
        triggerBurst();
      }
      resetSelection();
    },
    [level.validWords, foundWords, resetSelection, triggerBurst]
  );

  const handleTouchMove = useCallback(
    (x, y) => {
      const hit = findLetterAtPoint(positions, x, y);
      if (hit) addLetterToPath(hit);
    },
    [positions, addLetterToPath]
  );

  const handleTouchEnd = useCallback(() => {
    setSelectedIndices((prev) => {
      const word = prev.map((i) => level.letters[i]).join('');
      validateWord(word);
      return prev;
    });
  }, [level.letters, validateWord]);

  const startPathAt = useCallback(
    (x, y) => {
      const hit = findLetterAtPoint(positions, x, y);
      if (!hit) {
        resetSelection();
        return;
      }
      setSelectedIndices([hit.index]);
      setCurrentWord(hit.letter);
      setLinePoints([{ x: hit.x, y: hit.y }]);
    },
    [positions, resetSelection]
  );

  // Pan gesture: track finger across the wheel to chain letters
  const panGesture = Gesture.Pan()
    .onStart((e) => {
      runOnJS(startPathAt)(e.x, e.y);
    })
    .onUpdate((e) => {
      runOnJS(handleTouchMove)(e.x, e.y);
    })
    .onEnd(() => {
      runOnJS(handleTouchEnd)();
    });

  const polylinePoints = linePoints.map((p) => `${p.x},${p.y}`).join(' ');

  const levelComplete = foundWords.length >= Math.min(3, level.validWords.length);

  const nextLevel = () => {
    if (levelIndex < LEVELS.length - 1) {
      setLevelIndex((i) => i + 1);
      setFoundWords([]);
      resetSelection();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => navigate(SCREENS.HOME)}>
          <ArrowLeft color={COLORS.text} size={22} />
        </Pressable>
        <Text style={styles.levelLabel}>
          Level {levelIndex + 1} / {LEVELS.length}
        </Text>
        <Pressable style={styles.settingsBtn} onPress={() => navigate(SCREENS.SETTINGS)}>
          <Settings color={COLORS.text} size={22} />
        </Pressable>
      </View>

      {/* Preview box — shows the swiped letter chain */}
      <Animated.View style={[styles.previewBox, previewStyle]}>
        <Text style={styles.previewWord}>{currentWord || 'Swipe the wheel…'}</Text>
        <SuccessBurst visible={showBurst} />
      </Animated.View>

      <View style={styles.foundRow}>
        {foundWords.map((w) => (
          <View key={w} style={styles.foundChip}>
            <CheckCircle2 size={14} color={COLORS.success} />
            <Text style={styles.foundText}>{w}</Text>
          </View>
        ))}
      </View>

      {levelComplete && (
        <Pressable style={styles.nextBtn} onPress={nextLevel}>
          <Text style={styles.nextBtnText}>
            {levelIndex < LEVELS.length - 1 ? 'Next Level →' : 'All levels complete!'}
          </Text>
        </Pressable>
      )}

      {/* Circular letter wheel with SVG connection line */}
      <GestureDetector gesture={panGesture}>
        <View style={styles.wheelArea}>
          <Svg width={SCREEN_W} height={WHEEL_CY + WHEEL_RADIUS + 60} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={COLORS.primaryGlow} stopOpacity="0.95" />
                <Stop offset="1" stopColor={COLORS.accentGlow} stopOpacity="0.75" />
              </LinearGradient>
            </Defs>
            {linePoints.length >= 2 && (
              <Polyline
                points={polylinePoints}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
            )}
          </Svg>

          <View style={[styles.wheelRing, { left: WHEEL_CX - WHEEL_RADIUS - 8, top: WHEEL_CY - WHEEL_RADIUS - 8 }]} />

          {positions.map((pos) => {
            const isSelected = selectedIndices.includes(pos.index);
            const isFound = foundWords.some((w) => w.includes(pos.letter) && selectedIndices.includes(pos.index));
            return (
              <View
                key={`${pos.letter}-${pos.index}`}
                style={[
                  styles.letterNode,
                  {
                    left: pos.x - LETTER_RADIUS,
                    top: pos.y - LETTER_RADIUS,
                  },
                  isSelected && styles.letterSelected,
                  isFound && styles.letterFound,
                ]}
              >
                <Text style={styles.letterText}>{pos.letter}</Text>
              </View>
            );
          })}
        </View>
      </GestureDetector>

      <Text style={styles.hint}>Find {Math.min(3, level.validWords.length)} words to advance</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  settingsBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    marginLeft: 'auto',
  },
  levelLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  previewBox: {
    marginHorizontal: 24,
    marginTop: 20,
    minHeight: 72,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewWord: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
  },
  foundRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
    marginTop: 14,
    minHeight: 36,
  },
  foundChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  foundText: {
    color: COLORS.success,
    fontWeight: '600',
    fontSize: 13,
  },
  nextBtn: {
    marginHorizontal: 24,
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextBtnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 15,
  },
  wheelArea: {
    flex: 1,
    position: 'relative',
  },
  wheelRing: {
    position: 'absolute',
    width: (WHEEL_RADIUS + 8) * 2,
    height: (WHEEL_RADIUS + 8) * 2,
    borderRadius: WHEEL_RADIUS + 8,
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
  },
  letterNode: {
    position: 'absolute',
    width: LETTER_RADIUS * 2,
    height: LETTER_RADIUS * 2,
    borderRadius: LETTER_RADIUS,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterSelected: {
    borderColor: COLORS.primaryGlow,
    backgroundColor: COLORS.surfaceLight,
    shadowColor: COLORS.primaryGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  letterFound: {
    borderColor: COLORS.success,
  },
  letterText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
  hint: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 13,
    paddingBottom: 24,
  },
});
