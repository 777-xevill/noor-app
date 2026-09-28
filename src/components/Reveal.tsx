import type { ReactNode } from 'react';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { STAGGER_MS } from '@/theme/motion';

/**
 * Sections settle into place when a screen first appears: a short rise with a fade,
 * staggered by position. Runs once per mount; skipped when Reduce Motion is on.
 */
export function Reveal({ index, children }: { index: number; children: ReactNode }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(620)
        .delay(index * STAGGER_MS)
        .easing(Easing.out(Easing.cubic))
        .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] })}
    >
      {children}
    </Animated.View>
  );
}
