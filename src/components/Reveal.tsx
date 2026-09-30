import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { Platform, type StyleProp, View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { STAGGER_MS } from '@/theme/motion';

/** When the enclosing screen first rendered. Provided by <Screen>. */
export const ScreenBirth = createContext<number>(0);

// Sections that appear later (a tab switch, a toggle) should just be there, not animate in.
const ENTRANCE_WINDOW_MS = 700;
// On Android, animating the opacity of whole sections as a screen opens costs frames that budget
// phones don't have; there the content simply appears (the screen transition itself still moves).
const ANIMATE = Platform.OS !== 'android';

/**
 * A short fade-and-rise. Driven by a shared value on opacity/transform only — never by
 * layout animations, which on web can pull an element out of the flow when its content changes.
 * Skipped automatically when Reduce Motion is on (Reanimated's default).
 */
export function FadeUp(props: { delay?: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return ANIMATE ? <FadeUpAnimated {...props} /> : <View style={props.style}>{props.children}</View>;
}

function FadeUpAnimated({ delay = 0, style: outer, children }: { delay?: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }));
  }, [delay, progress]);
  const style = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ translateY: (1 - progress.value) * 14 }] }));
  return <Animated.View style={[outer, style]}>{children}</Animated.View>;
}

/** Sections settle into place when a screen first appears, staggered by position. */
export function Reveal({ index, children }: { index: number; children: ReactNode }) {
  return ANIMATE ? <RevealAnimated index={index}>{children}</RevealAnimated> : <View>{children}</View>;
}

function RevealAnimated({ index, children }: { index: number; children: ReactNode }) {
  const born = useContext(ScreenBirth);
  const [animate] = useState(() => !born || Date.now() - born < ENTRANCE_WINDOW_MS);
  const progress = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (animate) progress.value = withDelay(index * STAGGER_MS, withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }));
  }, [animate, index, progress]);
  const style = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ translateY: (1 - progress.value) * 14 }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
