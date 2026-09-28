import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { FadeUp } from '@/components/Reveal';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { MILESTONES } from '@/features/rewards/milestones';
import { useTheme } from '@/theme/useTheme';

/** Shown on Home when a milestone has been reached and not yet looked at. */
export function MilestoneCard({ ids }: { ids: string[] }) {
  const t = useTheme();
  const L = useT();
  const first = MILESTONES.find((m) => m.id === ids[0]);
  if (!first) return null;
  const title = L.t(`ms.${first.id}` as Key);

  return (
    <FadeUp>
      <Press onPress={() => router.push('/milestones')} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={`${L.t('ms.newTitle')}: ${title}`}>
        <Glass radius={26} padding={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={first.icon} size={22} color={t.onInk} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="eyebrow" tone="muted">
              {L.t('ms.newTitle')}
            </Txt>
            <Txt variant="title" numberOfLines={1}>
              {title}
            </Txt>
            {ids.length > 1 && (
              <Txt variant="caption" tone="muted">
                {L.t('ms.more', { n: ids.length - 1 })}
              </Txt>
            )}
          </View>
          <Icon name="chevronRight" size={18} color={t.textMuted} />
        </Glass>
      </Press>
    </FadeUp>
  );
}
