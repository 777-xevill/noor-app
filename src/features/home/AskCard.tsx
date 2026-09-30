import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Txt } from '@/components/Txt';
import { askEnabled } from '@/features/ask/ask';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';

/** On Home, under today's prayers: a question box that opens Ask Noor, ready to type. */
export function AskCard() {
  const t = useTheme();
  const L = useT();
  if (!askEnabled) return null;
  return (
    <Press
      onPress={() => router.push({ pathname: '/ask', params: { focus: '1' } })}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={L.t('ask.title')}
    >
      <Glass strong radius={26} padding={16} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={19} color={t.onInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="title">{L.t('ask.title')}</Txt>
            <Txt variant="caption" tone="muted" numberOfLines={1}>
              {L.t('ask.subtitle')}
            </Txt>
          </View>
        </View>
        <View
          style={{
            height: 46,
            borderRadius: 23,
            backgroundColor: t.pill,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Icon name="search" size={16} color={t.textMuted} />
          <Txt variant="body" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
            {L.t('home.askPh')}
          </Txt>
        </View>
      </Glass>
    </Press>
  );
}
