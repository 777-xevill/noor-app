import { useEffect } from 'react';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { timing } from '@/theme/motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = { size: number; stroke?: number; progress: number; color: string; track: string };

/** A ring that fills smoothly to its value (on first appearance and whenever it changes). */
export function ProgressRing({ size, stroke = 3, progress, color, track }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withTiming(Math.max(0, Math.min(1, progress)), timing.fill);
  }, [progress, value]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - value.value),
    // A round cap on a zero-length arc would still draw a dot.
    strokeOpacity: value.value > 0.004 ? 1 : 0,
  }));

  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}
