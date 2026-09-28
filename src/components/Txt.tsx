import { Text, type TextProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { type, type TypeVariant } from '@/theme/typography';

type Tone = 'default' | 'soft' | 'muted' | 'onInk';

type Props = TextProps & {
  variant?: TypeVariant;
  tone?: Tone;
  /** Explicit colour wins over tone (e.g. text on photographs). */
  color?: string;
  tabular?: boolean;
};

export function Txt({ variant = 'body', tone = 'default', color, tabular, style, ...rest }: Props) {
  const t = useTheme();
  const toneColor = { default: t.text, soft: t.textSoft, muted: t.textMuted, onInk: t.onInk }[tone];
  return (
    <Text
      {...rest}
      style={[type[variant], { color: color ?? toneColor }, tabular && { fontVariant: ['tabular-nums'] }, style]}
    />
  );
}
