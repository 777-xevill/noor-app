import { useEffect } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/useTheme';
import { onPhoto } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

type Props = {
  label: string;
  icon?: IconName;
  /** A softly pulsing dot marks something live (the next prayer). */
  live?: boolean;
  variant?: 'glass' | 'ink' | 'photo';
  style?: ViewStyle;
};

const webBlur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(14px)' } as ViewStyle) : null;

function LiveDot({ color }: { color: string }) {
  // A slow breathing halo; Reanimated skips it when Reduce Motion is on.
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
  }, [pulse]);
  const halo = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 0]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 2.4]) }],
  }));
  return (
    <View style={{ width: 8, height: 8, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: color }, halo]} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    </View>
  );
}

export function Chip({ label, icon, live, variant = 'glass', style }: Props) {
  const t = useTheme();
  const palette = {
    glass: { bg: t.glassStrong, border: t.glassBorder, fg: t.text },
    ink: { bg: t.ink, border: t.ink, fg: t.onInk },
    photo: { bg: onPhoto.chip, border: onPhoto.chipBorder, fg: onPhoto.text },
  }[variant];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          alignSelf: 'flex-start',
          paddingHorizontal: 12,
          height: 30,
          borderRadius: 15,
          backgroundColor: palette.bg,
          borderWidth: 1,
          borderColor: palette.border,
        },
        variant !== 'ink' && webBlur,
        style,
      ]}
    >
      {live && <LiveDot color={palette.fg} />}
      {icon && <Icon name={icon} size={13} color={palette.fg} strokeWidth={2} />}
      <Txt variant="caption" color={palette.fg} tabular>
        {label}
      </Txt>
    </View>
  );
}
