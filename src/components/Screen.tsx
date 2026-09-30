import { createContext, memo, useContext, useState, type ReactNode } from 'react';
import { ScreenBirth } from './Reveal';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { type SharedValue, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabBarCompactTarget } from '@/lib/scrollChrome';
import { useTheme } from '@/theme/useTheme';
import { GUTTER, TAB_BAR_CLEARANCE } from '@/theme/tokens';

const ScrollContext = createContext<SharedValue<number> | null>(null);

/** Vertical scroll offset of the enclosing screen (for parallax and scroll-linked effects). */
export const useScreenScroll = () => useContext(ScrollContext);

/**
 * The misty canvas every screen sits on: a soft vertical fade plus two pools of light. It is one
 * pre-rendered image per palette (scripts/data/render_canvas.py), so a screen draws a single texture
 * instead of computing full-screen gradients, which is noticeably slow on budget Android phones.
 */
const CANVAS = {
  light: require('../../assets/images/canvas/light.png'),
  dark: require('../../assets/images/canvas/dark.png'),
  midnight: require('../../assets/images/canvas/midnight.png'),
};

export const Canvas = memo(function Canvas() {
  const t = useTheme();
  const source = t.scheme === 'light' ? CANVAS.light : t.canvas === '#000000' ? CANVAS.midnight : CANVAS.dark;
  return <Image source={source} resizeMode="stretch" style={styles.canvas} fadeDuration={0} />;
});

const styles = StyleSheet.create({ canvas: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' } });

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
