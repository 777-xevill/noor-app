import { View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Icon } from './Icon';
import { Press } from './Press';
import { Txt } from './Txt';

type Props = { title: string; meta?: string; action?: string; onAction?: () => void };

export function SectionHeader({ title, meta, action, onAction }: Props) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 2 }}>
      <View style={{ gap: 2 }}>
        <Txt variant="h2">{title}</Txt>
        {meta ? (
          <Txt variant="caption" tone="muted">
            {meta}
          </Txt>
        ) : null}
      </View>
      {action ? (
        <Press onPress={onAction} accessibilityRole="button" hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Txt variant="caption" tone="soft">
            {action}
          </Txt>
          <Icon name="chevronRight" size={15} color={t.textSoft} strokeWidth={2} />
        </Press>
      ) : null}
    </View>
  );
}
