import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

const SPOKE_COUNT = 8;

/**
 * Ship's helm (steering wheel) backdrop for the letter wheel.
 * Soft glass fill + line-art hub, rings, spokes, and handle tips.
 */
export default function ShipHelm({ size, inset = 0 }) {
  const geometry = useMemo(() => {
    const c = size / 2;
    // Leave room for letter nodes around the rim.
    const outerR = c - inset;
    const midR = outerR * 0.72;
    const innerR = outerR * 0.42;
    const hubOuter = outerR * 0.16;
    const hubInner = outerR * 0.08;
    const handleLen = Math.max(10, outerR * 0.14);
    const handleR = Math.max(4.5, outerR * 0.055);

    const spokes = Array.from({ length: SPOKE_COUNT }, (_, i) => {
      const angle = (i / SPOKE_COUNT) * Math.PI * 2 - Math.PI / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        key: i,
        x1: c + hubOuter * cos,
        y1: c + hubOuter * sin,
        x2: c + outerR * cos,
        y2: c + outerR * sin,
        hx: c + (outerR + handleLen) * cos,
        hy: c + (outerR + handleLen) * sin,
        handleR,
      };
    });

    return { c, outerR, midR, innerR, hubOuter, hubInner, spokes };
  }, [size, inset]);

  const { c, outerR, midR, innerR, hubOuter, hubInner, spokes } = geometry;
  const stroke = 'rgba(255, 255, 255, 0.88)';
  const strokeSoft = 'rgba(236, 253, 245, 0.55)';
  const strokeWidth = Math.max(2.2, size * 0.012);

  return (
    <Svg
      width={size}
      height={size}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="helmGlass" cx="38%" cy="32%" r="70%">
          <Stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
          <Stop offset="45%" stopColor="rgba(153,246,228,0.28)" />
          <Stop offset="100%" stopColor="rgba(13,148,136,0.18)" />
        </RadialGradient>
        <LinearGradient id="helmRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <Stop offset="100%" stopColor="rgba(204,251,241,0.7)" />
        </LinearGradient>
      </Defs>

      <Circle cx={c} cy={c} r={outerR} fill="url(#helmGlass)" />

      <Circle
        cx={c}
        cy={c}
        r={outerR}
        fill="none"
        stroke="url(#helmRim)"
        strokeWidth={strokeWidth * 1.35}
      />
      <Circle
        cx={c}
        cy={c}
        r={midR}
        fill="none"
        stroke={strokeSoft}
        strokeWidth={strokeWidth * 0.9}
      />
      <Circle
        cx={c}
        cy={c}
        r={innerR}
        fill="none"
        stroke={strokeSoft}
        strokeWidth={strokeWidth * 0.85}
      />

      {spokes.map((s) => (
        <React.Fragment key={s.key}>
          <Line
            x1={s.x1}
            y1={s.y1}
            x2={s.hx}
            y2={s.hy}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Circle
            cx={s.hx}
            cy={s.hy}
            r={s.handleR}
            fill="rgba(255,255,255,0.92)"
            stroke={strokeSoft}
            strokeWidth={1.2}
          />
        </React.Fragment>
      ))}

      <Circle
        cx={c}
        cy={c}
        r={hubOuter}
        fill="rgba(255,255,255,0.55)"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <Circle
        cx={c}
        cy={c}
        r={hubInner}
        fill="rgba(13,148,136,0.35)"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.75}
      />
    </Svg>
  );
}
