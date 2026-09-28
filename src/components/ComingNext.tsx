import { View } from 'react-native';
import { Glass } from './Glass';
import { Icon, type IconName } from './Icon';
import { Reveal } from './Reveal';
import { Screen } from './Screen';
import { Txt } from './Txt';
import { useTheme } from '@/theme/useTheme';

/** Placeholder for a tab whose screen is built in a later task. */
export function ComingNext({ title, icon, body }: { title: string; icon: IconName; body: string }) {
  const t = useTheme();
  return (
    <Screen>
      <Reveal index={0}>
        <Txt variant="h1" style={{ marginTop: 8 }}>
          {title}
        </Txt>
      </Reveal>
      <Reveal index={1}>
      <Glass radius={26} padding={24} style={{ alignItems: 'center', gap: 14, paddingVertical: 40 }}>
        <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={28} color={t.onInk} />
        </View>
        <Txt variant="title">In the next task</Txt>
        <Txt variant="body" tone="muted" style={{ textAlign: 'center', maxWidth: 280 }}>
          {body}
        </Txt>
      </Glass>
      </Reveal>
    </Screen>
  );
}
