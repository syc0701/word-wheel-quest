import Svg, { Circle, Path } from 'react-native-svg';

/**
 * A simple chest: dark body, gold lid, light latch.
 * The old single-color glyph turned into a blob at small sizes.
 */
export function PiTreasureChest({ size = 18, style }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={style}
      accessibilityRole="image"
      accessibilityLabel="treasure chest"
    >
      <Path
        fill="#92400E"
        d="M10 32h44v18a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8V32z"
      />
      <Path
        fill="#F5C542"
        d="M10 32v-6C10 14 19 6 32 6s22 8 22 20v6H10z"
      />
      <Path fill="#78350F" d="M10 28h44v8H10z" />
      <Path
        fill="#FFF7D6"
        d="M27 30h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H27a2 2 0 0 1-2-2V32a2 2 0 0 1 2-2z"
      />
      <Circle cx="32" cy="36" r="2.4" fill="#78350F" />
      <Path fill="#78350F" d="M31 37h2v5h-2z" />
    </Svg>
  );
}

export default PiTreasureChest;
