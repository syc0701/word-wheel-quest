import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { INTERMISSION } from './intermissionTheme';

/** Subtle corner gold filigree ornaments for the interstitial card. */
export default function GoldFiligree() {
  const stroke = INTERMISSION.filigree;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 320 420" preserveAspectRatio="xMidYMid slice">
        <Path
          d="M28 48 C48 28, 78 34, 92 52 C78 48, 58 58, 48 78 C42 58, 34 52, 28 48Z"
          fill={stroke}
        />
        <Path
          d="M292 48 C272 28, 242 34, 228 52 C242 48, 262 58, 272 78 C278 58, 286 52, 292 48Z"
          fill={stroke}
        />
        <Path
          d="M28 372 C48 392, 78 386, 92 368 C78 372, 58 362, 48 342 C42 362, 34 368, 28 372Z"
          fill={stroke}
        />
        <Path
          d="M292 372 C272 392, 242 386, 228 368 C242 372, 262 362, 272 342 C278 362, 286 368, 292 372Z"
          fill={stroke}
        />
        <Circle cx="160" cy="36" r="2.2" fill={stroke} />
        <Circle cx="160" cy="384" r="2.2" fill={stroke} />
        <Path
          d="M110 36 Q160 18 210 36"
          stroke={stroke}
          strokeWidth="1.2"
          fill="none"
        />
        <Path
          d="M110 384 Q160 402 210 384"
          stroke={stroke}
          strokeWidth="1.2"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.95,
  },
});
