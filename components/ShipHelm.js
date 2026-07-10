import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

const CROSSHAIR_COUNT = 4;
const TICK_COUNT = 8;
/** Full rotation period — slow radar search feel. */
const SWEEP_MS = 22000;

/**
 * Radar-style backdrop for the letter wheel.
 * Concentric rings + rotating sweep beam (no helm handles).
 */
export default function ShipHelm({ size, inset = 0 }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, { duration: SWEEP_MS, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const geometry = useMemo(() => {
    const c = size / 2;
    const outerR = Math.max(8, c - inset);
    const rings = [1, 0.78, 0.56, 0.34].map((t) => outerR * t);
    const hubOuter = outerR * 0.12;
    const hubInner = outerR * 0.055;

    const crosshairs = Array.from({ length: CROSSHAIR_COUNT }, (_, i) => {
      const angle = (i / CROSSHAIR_COUNT) * Math.PI * 2 - Math.PI / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        key: `cross-${i}`,
        x1: c + hubOuter * cos,
        y1: c + hubOuter * sin,
        x2: c + outerR * cos,
        y2: c + outerR * sin,
      };
    });

    const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
      const angle = (i / TICK_COUNT) * Math.PI * 2 - Math.PI / 2 + Math.PI / TICK_COUNT;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const inner = outerR * 0.9;
      return {
        key: `tick-${i}`,
        x1: c + inner * cos,
        y1: c + inner * sin,
        x2: c + outerR * cos,
        y2: c + outerR * sin,
      };
    });

    // Trail wedge behind the leading beam (clockwise sweep).
    const sweepSpan = Math.PI * 0.62;
    const sweepStart = -Math.PI / 2 - sweepSpan;
    const sweepEnd = -Math.PI / 2;
    const sx = c + outerR * Math.cos(sweepStart);
    const sy = c + outerR * Math.sin(sweepStart);
    const ex = c + outerR * Math.cos(sweepEnd);
    const ey = c + outerR * Math.sin(sweepEnd);
    const sweepPath = `M ${c} ${c} L ${sx} ${sy} A ${outerR} ${outerR} 0 0 1 ${ex} ${ey} Z`;

    const beamX = c;
    const beamY = c - outerR;

    return {
      c,
      outerR,
      rings,
      hubOuter,
      hubInner,
      crosshairs,
      ticks,
      sweepPath,
      beamX,
      beamY,
    };
  }, [size, inset]);

  const {
    c,
    outerR,
    rings,
    hubOuter,
    hubInner,
    crosshairs,
    ticks,
    sweepPath,
    beamX,
    beamY,
  } = geometry;

  const stroke = 'rgba(255, 255, 255, 0.88)';
  const strokeSoft = 'rgba(236, 253, 245, 0.5)';
  const strokeWidth = Math.max(1.8, size * 0.01);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { width: size, height: size }]} pointerEvents="none">
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="radarGlass" cx="42%" cy="38%" r="68%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.38)" />
            <Stop offset="40%" stopColor="rgba(153,246,228,0.26)" />
            <Stop offset="100%" stopColor="rgba(13,148,136,0.16)" />
          </RadialGradient>
          <LinearGradient id="radarRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <Stop offset="100%" stopColor="rgba(204,251,241,0.7)" />
          </LinearGradient>
        </Defs>

        <Circle cx={c} cy={c} r={outerR} fill="url(#radarGlass)" />
      </Svg>

      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
          },
          sweepStyle,
        ]}
      >
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
              <Stop offset="55%" stopColor="rgba(153,246,228,0.18)" />
              <Stop offset="100%" stopColor="rgba(153,246,228,0)" />
            </RadialGradient>
          </Defs>
          <Path d={sweepPath} fill="url(#radarSweep)" opacity={0.9} />
          <Line
            x1={c}
            y1={c}
            x2={beamX}
            y2={beamY}
            stroke="rgba(255,255,255,0.95)"
            strokeWidth={Math.max(2, size * 0.012)}
            strokeLinecap="round"
            opacity={0.9}
          />
          <Circle
            cx={beamX}
            cy={beamY}
            r={Math.max(2.5, size * 0.012)}
            fill="rgba(255,255,255,0.95)"
          />
        </Svg>
      </Animated.View>

      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="radarRimTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <Stop offset="100%" stopColor="rgba(204,251,241,0.7)" />
          </LinearGradient>
        </Defs>

        {rings.map((r, i) => (
          <Circle
            key={`ring-${i}`}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={i === 0 ? 'url(#radarRimTop)' : strokeSoft}
            strokeWidth={i === 0 ? strokeWidth * 1.35 : strokeWidth * 0.85}
          />
        ))}

        {crosshairs.map((s) => (
          <Line
            key={s.key}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={stroke}
            strokeWidth={strokeWidth * 0.95}
            strokeLinecap="round"
            opacity={0.85}
          />
        ))}

        {ticks.map((t) => (
          <Line
            key={t.key}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={strokeSoft}
            strokeWidth={strokeWidth * 0.8}
            strokeLinecap="round"
          />
        ))}

        <Circle
          cx={c}
          cy={c}
          r={hubOuter}
          fill="rgba(255,255,255,0.5)"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={c}
          cy={c}
          r={hubInner}
          fill="rgba(45, 212, 191, 0.55)"
          stroke={stroke}
          strokeWidth={strokeWidth * 0.7}
        />
      </Svg>
    </View>
  );
}
