import { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Txt } from '@/components/Txt';
import { sameDay } from '@/lib/dates';
import { useT } from '@/i18n';
import { useSchedule } from '@/features/prayer/useSchedule';
import { ramadanInfo } from '@/features/ramadan/calendar';
import { useRamadan } from '@/features/ramadan/store';
import { useTheme } from '@/theme/useTheme';

/** On Home: a Sehri/Iftar countdown during Ramadan, or a gentle reminder in the two months before. */
export function RamadanCard() {
  const t = useTheme();
  const L = useT();
  const { now, loc, prefs, hijriOffset, schedule } = useSchedule();
  const margin = useRamadan((s) => s.sehriMargin);
  const info = useMemo(() => ramadanInfo(schedule.day, loc, prefs, hijriOffset, margin), [schedule.day, loc, prefs, hijriOffset, margin]);
  if (!info.inRamadan && info.daysUntil > 60) return null;

  const today = info.inRamadan ? info.days.find((d) => sameDay(d.g, schedule.day)) : undefined;
  const next = today && now < today.sehriEnds ? { label: L.t('ramadan.sehriEnds'), at: today.sehriEnds } : today && now < today.iftar ? { label: L.t('ramadan.iftar'), at: today.iftar } : null;

  return (
    <Press onPress={() => router.push('/ramadan')} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={L.t('ramadan.title')}>
      <Glass strong radius={26} padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="moonStar" size={24} color={t.onInk} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="eyebrow" tone="muted">
            {today ? L.t('ramadan.dayN', { n: today.day }) : L.t('ramadan.homeCountdown', { n: info.daysUntil })}
          </Txt>
          <Txt variant="title">{next ? `${next.label} · ${L.clockFull(next.at, loc.timeZone)}` : L.t('ramadan.homeOpen')}</Txt>
        </View>
        {next ? (
          <Txt variant="title" tabular>
            {L.countdown(next.at.getTime() - now.getTime())}
          </Txt>
        ) : (
          <Icon name="chevronRight" size={18} color={t.textMuted} />
        )}
      </Glass>
    </Press>
  );
}
