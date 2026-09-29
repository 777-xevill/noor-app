import { useId } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, G, Path, Pattern, Polygon, Rect } from 'react-native-svg';

// Greeting-card backgrounds drawn in code (Noor Plus). Geometric ornament only, in the brand's
// greys, dark enough for white lettering.

export type PatternKind = 'khatam' | 'zellige' | 'arches' | 'night';
export const PATTERNS: PatternKind[] = ['khatam', 'zellige', 'arches', 'night'];

const GRADIENTS: Record<PatternKind, [string, string]> = {
  khatam: ['#2B2E34', '#121316'],
  zellige: ['#34373D', '#1A1C20'],
  arches: ['#23262B', '#0C0D0F'],
  night: ['#1E2126', '#050506'],
};

/** Points of an n-pointed star centred on (cx, cy). */
function star(cx: number, cy: number, outer: number, inner: number, points = 8) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / points - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

// A fixed scatter so the night sky looks the same every time.
const STARS = [
  [12, 18, 1.1], [30, 64, 0.8], [52, 12, 0.9], [70, 40, 1.3], [18, 88, 0.7], [84, 20, 0.8], [44, 34, 0.6],
  [64, 76, 0.9], [8, 52, 0.8], [90, 58, 0.7], [36, 90, 1.0], [76, 94, 0.6], [58, 56, 0.5], [24, 38, 0.6],
] as const;

export function CardPattern({ kind }: { kind: PatternKind }) {
  const id = `p${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const line = 'rgba(255,255,255,0.16)';
  return (
    <>
      <LinearGradient colors={GRADIENTS[kind]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox={kind === 'night' ? '0 0 100 125' : undefined} preserveAspectRatio="xMidYMid slice">
        {kind === 'night' ? (
          <G>
            {STARS.map(([x, y, r], i) => (
              <Circle key={i} cx={x} cy={y} r={r * 0.6} fill="rgba(255,255,255,0.55)" />
            ))}
            {/* Crescent: a disc with a second, offset disc taken out of it. */}
            <Path d="M78 18 a14 14 0 1 0 10 24 a11 11 0 1 1 -10 -24 z" fill="rgba(255,255,255,0.85)" />
          </G>
        ) : (
          <>
            <Defs>
              {kind === 'khatam' && (
                <Pattern id={id} width={44} height={44} patternUnits="userSpaceOnUse">
                  <Rect x={11} y={11} width={22} height={22} fill="none" stroke={line} strokeWidth={1} />
                  <Polygon points="22,6.4 37.6,22 22,37.6 6.4,22" fill="none" stroke={line} strokeWidth={1} />
                  <Circle cx={22} cy={22} r={2} fill={line} />
                </Pattern>
              )}
              {kind === 'zellige' && (
                <Pattern id={id} width={48} height={48} patternUnits="userSpaceOnUse">
                  <Polygon points={star(24, 24, 15, 7)} fill="rgba(255,255,255,0.05)" stroke={line} strokeWidth={1} />
                  <Polygon points={star(0, 0, 9, 4.5)} fill="none" stroke={line} strokeWidth={1} />
                  <Polygon points={star(48, 0, 9, 4.5)} fill="none" stroke={line} strokeWidth={1} />
                  <Polygon points={star(0, 48, 9, 4.5)} fill="none" stroke={line} strokeWidth={1} />
                  <Polygon points={star(48, 48, 9, 4.5)} fill="none" stroke={line} strokeWidth={1} />
                </Pattern>
              )}
              {kind === 'arches' && (
                <Pattern id={id} width={40} height={56} patternUnits="userSpaceOnUse">
                  <Path d="M6 56 V30 Q6 14 20 6 Q34 14 34 30 V56" fill="none" stroke={line} strokeWidth={1} />
                  <Path d="M12 56 V32 Q12 21 20 15 Q28 21 28 32 V56" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                </Pattern>
              )}
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${id})`} />
          </>
        )}
      </Svg>
    </>
  );
}
