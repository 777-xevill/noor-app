import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { useSettings } from '@/features/settings/store';
import { BANGLA_FAMILY } from '@/theme/fonts';
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
  const bangla = useSettings((s) => s.language === 'bn');
  const toneColor = { default: t.text, soft: t.textSoft, muted: t.textMuted, onInk: t.onInk }[tone];
  const base = [type[variant], { color: color ?? toneColor }, tabular && { fontVariant: ['tabular-nums' as const] }, style];
  if (!bangla) return <Text {...rest} style={base} />;
  // Bangla: swap the Latin UI face for the matching Bangla weight, and drop letter spacing either way
  // (tight tracking crowds conjuncts; wide tracking pulls a word's letters apart).
  // Arabic faces (Amiri) are left untouched.
  const flat: TextStyle = StyleSheet.flatten(base);
  const family = flat.fontFamily && BANGLA_FAMILY[flat.fontFamily];
  return (
    <Text
      {...rest}
      style={family ? [flat, { fontFamily: family, letterSpacing: 0, lineHeight: flat.lineHeight ? flat.lineHeight * 1.12 : undefined }] : flat}
    />
  );
}
