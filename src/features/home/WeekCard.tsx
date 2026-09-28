import { View } from 'react-native';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { ProgressRing } from '@/components/ProgressRing';
import { Txt } from '@/components/Txt';
import { addDays, dayKey, weekdayMon0 } from '@/lib/dates';
import { usePrayerLog } from '@/features/prayer/log';
import { useSchedule } from '@/features/prayer/useSchedule';
import { useTheme } from '@/theme/useTheme';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeekCard() {
  const t = useTheme();
  const { schedule } = useSchedule(60_000);
  const days = usePrayerLog((s) => s.days);
  const today = schedule.day;
  const monday = addDays(today, -weekdayMon0(today));
  const week = LETTERS.map((letter, i) => {
    const day = addDays(monday, i);
    const count = days[dayKey(day)]?.length ?? 0;
    return { letter, day, count, isToday: i === weekdayMon0(today), isFuture: i > weekdayMon0(today) };
  });
  const total = week.reduce((sum, d) => sum + d.count, 0);
  const possible = (weekdayMon0(today) + 1) * 5;

  // Consecutive days (ending yesterday, or today once complete) with all five prayers.
  let streak = 0;
  let cursor = (days[dayKey(today)]?.length ?? 0) === 5 ? today : addDays(today, -1);
  while ((days[dayKey(cursor)]?.length ?? 0) === 5) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return (
    <Glass radius={26} padding={16} style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flexShrink: 1 }}>
          <Txt variant="title">This week</Txt>
          <Txt variant="caption" tone="muted" tabular>
            {total} of {possible} prayers so far
          </Txt>
        </View>
        {streak > 0 && <Chip variant="ink" label={`${streak}-day streak`} />}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {week.map(({ letter, day, count, isToday, isFuture }, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 8, flex: 1 }}>
            <Txt variant="micro" tone="muted">
              {letter}
            </Txt>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isToday ? t.ink : 'transparent',
              }}
            >
              <Txt variant="bodyStrong" tone={isToday ? 'onInk' : isFuture ? 'muted' : 'default'} tabular>
                {day.d}
              </Txt>
            </View>
            <View style={{ opacity: isFuture ? 0.45 : 1 }}>
              <ProgressRing size={24} stroke={3} progress={count / 5} color={t.ink} track={t.track} />
            </View>
          </View>
        ))}
      </View>
    </Glass>
  );
}
