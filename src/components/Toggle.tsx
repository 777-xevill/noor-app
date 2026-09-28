import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { spring } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';
import { Press } from './Press';

/** iOS-style switch in the app's ink colour. */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const t = useTheme();
  const on = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    on.value = withSpring(value ? 1 : 0, spring.snappy);
  }, [value, on]);

  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(on.value, [0, 1], [t.track, t.ink]) }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: on.value * 20 }] }));

  return (
    <Press
      scaleTo={0.94}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onChange(!value);
      }}
    >
      <Animated.View style={[{ width: 50, height: 30, borderRadius: 15, padding: 3 }, track]}>
        <Animated.View
          style={[
            { width: 24, height: 24, borderRadius: 12, backgroundColor: t.scheme === 'dark' && value ? t.onInk : '#FFFFFF', boxShadow: '0px 2px 6px rgba(0,0,0,0.18)' },
            knob,
          ]}
        />
      </Animated.View>
    </Press>
  );
}
