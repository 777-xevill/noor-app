import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from 'expo-router/tabs';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabBarCompactTarget } from '@/lib/scrollChrome';
import { spring, timing } from '@/theme/motion';
import { useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { useTheme } from '@/theme/useTheme';
import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { Txt } from './Txt';

const TABS: Record<string, { label: Key; icon: IconName }> = {
  index: { label: 'tab.home', icon: 'home' },
  prayers: { label: 'tab.prayers', icon: 'mosque' },
  quran: { label: 'tab.quran', icon: 'book' },
  explore: { label: 'tab.explore', icon: 'grid' },
};

const PAD = 6; // inset of the selection pill inside the bar
const HEIGHT = { full: 70, compact: 56 };
const SIDE_INSET = { full: 16, compact: 46 };
const MAX_WIDTH = 440;
const LABEL_H = 14;

const webBlur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(22px) saturate(170%)' } as ViewStyle) : null;

function TabItem({
  tab,
  focused,
  compact,
  onPress,
}: {
  tab: { label: string; icon: IconName };
  focused: boolean;
  compact: SharedValue<number>;
  onPress: () => void;
}) {
  const t = useTheme();
  const focus = useSharedValue(focused ? 1 : 0);
  const bump = useSharedValue(1);
  const mounted = useRef(false);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, timing.fade);
    // A single soft bounce when a tab becomes selected (not on first render).
    if (focused && mounted.current) {
      bump.value = withSequence(withTiming(1.14, { duration: 130, easing: Easing.out(Easing.quad) }), withSpring(1, spring.bouncy));
    }
    mounted.current = true;
  }, [focused, focus, bump]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(compact.value, [0, 1], [0, (LABEL_H + 4) / 2]) }, { scale: bump.value }],
  }));
  const activeLayer = useAnimatedStyle(() => ({ opacity: focus.value }));
  const restingLayer = useAnimatedStyle(() => ({ opacity: 1 - focus.value }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: 1 - compact.value,
    transform: [{ translateY: interpolate(compact.value, [0, 1], [0, 6]) }, { scale: interpolate(compact.value, [0, 1], [1, 0.9]) }],
  }));

  return (
    <Press
      onPress={onPress}
      scaleTo={0.9}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={tab.label}
      style={styles.item}
    >
      <Animated.View style={[styles.icon, iconStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, restingLayer]}>
          <Icon name={tab.icon} size={23} color={t.brandGrey} strokeWidth={1.8} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, activeLayer]}>
          <Icon name={tab.icon} size={23} color={t.ink} strokeWidth={2.3} />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.labelBox, labelStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, restingLayer]}>
          <Txt variant="caption" color={t.brandGrey} style={styles.label}>
            {tab.label}
          </Txt>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, activeLayer]}>
          <Txt variant="title" color={t.ink} style={styles.label}>
            {tab.label}
          </Txt>
        </Animated.View>
      </Animated.View>
    </Press>
  );
}

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const { t: tr } = useT();
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((r) => TABS[r.name]);
  const active = routes.findIndex((r) => r.key === state.routes[state.index]?.key);
  const count = routes.length;

  const available = useSharedValue(0);
  const compact = useDerivedValue(() => withSpring(tabBarCompactTarget.value, spring.smooth));
  // Pill edges, measured in "tab units" so they stay correct while the bar resizes.
  const left = useSharedValue(active);
  const right = useSharedValue(active + 1);
  const previous = useRef(active);

  useEffect(() => {
    const from = previous.current;
    previous.current = active;
    tabBarCompactTarget.value = 0;
    if (from === active) return;
    // The edge in the direction of travel leads; the other trails, so the pill stretches then settles.
    const forward = active > from;
    left.value = withSpring(active, forward ? spring.trail : spring.lead);
    right.value = withSpring(active + 1, forward ? spring.lead : spring.trail);
  }, [active, left, right]);

  const barStyle = useAnimatedStyle(() => {
    const height = interpolate(compact.value, [0, 1], [HEIGHT.full, HEIGHT.compact]);
    const inset = interpolate(compact.value, [0, 1], [SIDE_INSET.full, SIDE_INSET.compact]);
    const width = Math.min(available.value - inset * 2, MAX_WIDTH - (inset - SIDE_INSET.full) * 2);
    return available.value === 0 ? { opacity: 0 } : { opacity: 1, width, height, borderRadius: height / 2 };
  });

  const pillStyle = useAnimatedStyle(() => {
    const height = interpolate(compact.value, [0, 1], [HEIGHT.full, HEIGHT.compact]);
    const inset = interpolate(compact.value, [0, 1], [SIDE_INSET.full, SIDE_INSET.compact]);
    const width = Math.min(available.value - inset * 2, MAX_WIDTH - (inset - SIDE_INSET.full) * 2);
    const unit = (width - PAD * 2) / count;
    return {
      left: PAD + left.value * unit,
      width: Math.max(0, (right.value - left.value) * unit),
      borderRadius: (height - PAD * 2) / 2,
    };
  });

  return (
    <View
      pointerEvents="box-none"
      onLayout={(e) => available.set(e.nativeEvent.layout.width)}
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 8 }]}
    >
      <Animated.View style={[styles.bar, { borderColor: t.glassBorder, boxShadow: t.shadow }, barStyle]}>
        {Platform.OS === 'ios' && <BlurView intensity={40} tint={t.scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: t.tabBar }, webBlur]} />
        <LinearGradient colors={[t.specular, 'transparent']} style={styles.sheen} pointerEvents="none" />
        <Animated.View style={[styles.pill, { backgroundColor: t.pill }, pillStyle]} />

        {routes.map((route, index) => {
          const focused = index === active;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              navigation.navigate(route.name, route.params);
            }
            // Tapping the bar always brings it back to full size.
            tabBarCompactTarget.value = 0;
          };
          const tab = TABS[route.name];
          return <TabItem key={route.key} tab={{ label: tr(tab.label), icon: tab.icon }} focused={focused} compact={compact} onPress={onPress} />;
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: { borderWidth: 1, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: 30, opacity: 0.55 },
  pill: { position: 'absolute', top: PAD, bottom: PAD },
  item: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', gap: 4 },
  icon: { width: 26, height: 26 },
  center: { alignItems: 'center', justifyContent: 'center' },
  labelBox: { height: LABEL_H, alignSelf: 'stretch' },
  label: { fontSize: 11.5, lineHeight: LABEL_H, textAlign: 'center' },
});
