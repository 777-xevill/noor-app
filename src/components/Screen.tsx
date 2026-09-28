import { createContext, useContext, useId, useState, type ReactNode } from 'react';
import { ScreenBirth } from './Reveal';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { type SharedValue, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabBarCompactTarget } from '@/lib/scrollChrome';
import { useTheme } from '@/theme/useTheme';
import { GUTTER, TAB_BAR_CLEARANCE } from '@/theme/tokens';

const ScrollContext = createContext<SharedValue<number> | null>(null);

/** Vertical scroll offset of the enclosing screen (for parallax and scroll-linked effects). */
export const useScreenScroll = () => useContext(ScrollContext);

/** The misty canvas every screen sits on: a soft vertical fade plus two pools of light. */
export function Canvas() {
  const t = useTheme();
  // Gradient ids are document-global on web; keep them unique per mounted screen.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const top = `glowTop${uid}`;
  const bottom = `glowBottom${uid}`;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[t.canvasTop, t.canvas]} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id={top} cx="18%" cy="0%" rx="85%" ry="45%">
            <Stop offset="0" stopColor={t.glow} stopOpacity={t.scheme === 'dark' ? 0.55 : 0.95} />
            <Stop offset="1" stopColor={t.glow} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={bottom} cx="100%" cy="78%" rx="70%" ry="40%">
            <Stop offset="0" stopColor={t.glow} stopOpacity={t.scheme === 'dark' ? 0.25 : 0.55} />
            <Stop offset="1" stopColor={t.glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${top})`} />
        <Rect width="100%" height="100%" fill={`url(#${bottom})`} />
      </Svg>
    </View>
  );
}

// Direction changes smaller than this are treated as jitter.
const SCROLL_SLOP = 4;
// Near the top the bar always stays expanded.
const EXPANDED_ZONE = 80;

/** `tabs`: the screen sits under the floating tab bar (extra bottom space, content fades beneath it). */
export function Screen({ children, gap = 22, tabs = false }: { children: ReactNode; gap?: number; tabs?: boolean }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const lastY = useSharedValue(0);
  const [born] = useState(() => Date.now());

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      const dy = y - lastY.value;
      lastY.value = y;
      scrollY.value = y;
      let target = tabBarCompactTarget.value;
      if (y < EXPANDED_ZONE) target = 0;
      else if (dy > SCROLL_SLOP) target = 1;
      else if (dy < -SCROLL_SLOP) target = 0;
      if (target !== tabBarCompactTarget.value) tabBarCompactTarget.value = target;
    },
  });

  return (
    <ScreenBirth.Provider value={born}>
    <ScrollContext.Provider value={scrollY}>
      <View style={{ flex: 1, backgroundColor: t.canvas }}>
        <Canvas />
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + 12,
            paddingHorizontal: GUTTER,
            paddingBottom: insets.bottom + (tabs ? TAB_BAR_CLEARANCE : 36),
            gap,
          }}
        >
          {children}
        </Animated.ScrollView>

        {/* Scroll edge effects: content dissolves under the status bar and the floating tab bar. */}
        <LinearGradient
          pointerEvents="none"
          colors={[t.canvasTop, `${t.canvasTop}00`]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 18 }}
        />
        {tabs && (
          <LinearGradient
            pointerEvents="none"
            colors={[`${t.canvas}00`, `${t.canvas}D9`, t.canvas]}
            locations={[0, 0.6, 1]}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: insets.bottom + 120 }}
          />
        )}
      </View>
    </ScrollContext.Provider>
    </ScreenBirth.Provider>
  );
}
