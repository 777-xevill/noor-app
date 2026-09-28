import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { Txt } from './Txt';

type Props = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  /** Hide the separator under the last row of a group. */
  last?: boolean;
  destructive?: boolean;
};

/** One row inside a grouped glass card (settings, lists). */
export function ListRow({ title, subtitle, icon, value, right, onPress, last, destructive }: Props) {
  const t = useTheme();
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 54,
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.line,
      }}
    >
      {icon ? (
        <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: t.pill, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={18} color={t.text} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 1 }}>
        <Txt variant="bodyStrong" color={destructive ? '#C8413B' : undefined}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" tone="muted">
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {value ? (
        <Txt variant="caption" tone="soft" numberOfLines={1} style={{ maxWidth: '45%', textAlign: 'right' }}>
          {value}
        </Txt>
      ) : null}
      {right}
      {onPress && !right ? <Icon name="chevronRight" size={17} color={t.textMuted} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Press onPress={onPress} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={title}>
      {content}
    </Press>
  );
}

/** A titled group of rows. */
export function ListGroup({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {title ? (
        <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
          {title}
        </Txt>
      ) : null}
      <View
        style={{
          backgroundColor: t.glass,
          borderColor: t.glassBorder,
          borderWidth: 1,
          borderRadius: 22,
          paddingHorizontal: 14,
          boxShadow: t.shadowSoft,
        }}
      >
        {children}
      </View>
      {footer ? (
        <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
          {footer}
        </Txt>
      ) : null}
    </View>
  );
}
