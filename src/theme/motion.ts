import { Easing, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

// Motion tokens. Springs are tuned the way iOS describes them (duration + damping ratio):
// critically damped for layout, a touch of overshoot only for small "delight" moments.
// Every animation respects the OS Reduce Motion setting (Reanimated's default ReduceMotion.System).
export const spring = {
  /** Selection moving between options (tab pill). */
  snappy: { duration: 380, dampingRatio: 0.86 },
  /** Large layout changes (tab bar compacting). No overshoot. */
  smooth: { duration: 520, dampingRatio: 1 },
  /** Small delight moments: icon bounce, check mark pop. */
  bouncy: { duration: 460, dampingRatio: 0.58 },
  /** A pressed control settling back. */
  release: { duration: 420, dampingRatio: 0.66 },
  /** Leading / trailing edges of a stretching selection. */
  lead: { duration: 300, dampingRatio: 0.92 },
  trail: { duration: 500, dampingRatio: 0.88 },
} satisfies Record<string, WithSpringConfig>;

export const timing = {
  pressIn: { duration: 90, easing: Easing.out(Easing.quad) },
  fade: { duration: 220, easing: Easing.out(Easing.cubic) },
  fill: { duration: 750, easing: Easing.out(Easing.cubic) },
} satisfies Record<string, WithTimingConfig>;

/** Stagger between sections as a screen settles in. */
export const STAGGER_MS = 55;
