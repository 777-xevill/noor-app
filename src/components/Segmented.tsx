import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, Platform, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { spring } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';
import { Press } from './Press';
import { Txt } from './Txt';

type Option<T extends string> = { value: T; label: string };

/** Pill segmented control; the selected capsule glides between options. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const pos = useSharedValue(index);

  useEffect(() => {
    pos.value = withSpring(index, spring.snappy);
  }, [index, pos]);

  const segment = width > 0 ? (width - 8) / options.length : 0;
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: pos.value * segment }], width: segment }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: t.pill, borderWidth: 1, borderColor: t.line }}
    >
      {width > 0 && (
        <Animated.View
          style={[{ position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 999, backgroundColor: t.ink }, pill]}
        />
      )}
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Press
            key={o.value}
            scaleTo={0.95}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected && Platform.OS !== 'web') Haptics.selectionAsync();
              onChange(o.value);
            }}
            style={{ flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' }}
          >
            <Txt variant="caption" tone={selected ? 'onInk' : 'soft'} numberOfLines={1}>
              {o.label}
            </Txt>
          </Press>
        );
      })}
    </View>
  );
}
