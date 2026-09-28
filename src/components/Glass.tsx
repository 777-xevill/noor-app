import { Platform, View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { radius as R } from '@/theme/tokens';

// Frosted surface. On web we add a real backdrop blur; on native the translucent fill over the
// misty canvas reads as glass without paying for a blur per card.
const webBlur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px) saturate(140%)' } as ViewStyle) : null;

type Props = ViewProps & {
  strong?: boolean;
  radius?: number;
  padding?: number;
  elevated?: boolean;
};

export function Glass({ strong, radius = R.lg, padding = 16, elevated = true, style, ...rest }: Props) {
  const t = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: strong ? t.glassStrong : t.glass,
          borderColor: t.glassBorder,
          borderWidth: 1,
          borderRadius: radius,
          padding,
          boxShadow: elevated ? t.shadowSoft : undefined,
        },
        webBlur,
        style,
      ]}
    />
  );
}
