import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Press } from '@/components/Press';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { addDays, type DayParts, dayKey, daysBetween, longDate } from '@/lib/dates';
import { useFasting } from '@/features/fasting/store';
import { EXTRAS, hasContent, MOODS, useJournal } from '@/features/journal/store';
import { usePrayerLog } from '@/features/prayer/log';
import { useSchedule } from '@/features/prayer/useSchedule';
import { useTheme } from '@/theme/useTheme';

const openEntry = (day: DayParts) => router.push({ pathname: '/journal/[date]', params: { date: dayKey(day) } });

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Txt variant="h2" tabular>
        {value}
      </Txt>
      <Txt variant="caption" tone="muted">
        {label}
      </Txt>
    </View>
  );
}

export default function JournalScreen() {
  const t = useTheme();
  const { schedule, hijriOffset } = useSchedule(60_000);
  const today = schedule.day;
  const [tab, setTab] = useState<'entries' | 'insights'>('entries');
  const [view, setView] = useState({ y: today.y, m: today.m });
  const [selected, setSelected] = useState<DayParts>(today);
  const entries = useJournal((s) => s.entries);
  const prayers = usePrayerLog((s) => s.days);
  const fasts = useFasting((s) => s.days);

  // Streak: consecutive days with an entry, ending today (or yesterday if today is still empty).
  let streak = 0;
  let cursor = hasContent(entries[dayKey(today)]) ? today : addDays(today, -1);
  while (hasContent(entries[dayKey(cursor)])) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, -i));
  const week = {
    journaled: last7.filter((d) => hasContent(entries[dayKey(d)])).length,
    prayers: last7.reduce((n, d) => n + (prayers[dayKey(d)]?.length ?? 0), 0),
    fasts: last7.filter((d) => fasts[dayKey(d)] === 'fasted').length,
    deeds: last7.reduce((n, d) => n + (entries[dayKey(d)]?.deeds.length ?? 0), 0),
    moods: MOODS.map((m) => ({ ...m, count: last7.filter((d) => entries[dayKey(d)]?.moods.includes(m.key)).length })).filter((m) => m.count > 0),
    extras: EXTRAS.map((x) => ({ ...x, count: last7.filter((d) => entries[dayKey(d)]?.extras.includes(x.key)).length })).filter((x) => x.count > 0),
  };
  const maxMood = Math.max(1, ...week.moods.map((m) => m.count));

  const sel = entries[dayKey(selected)];
  const future = daysBetween(today, selected) > 0;

  return (
    <Screen gap={16}>
      <ScreenHeader title="Journal" subtitle={streak ? `${streak}-day streak` : 'Reflect on your day'} />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'entries', label: 'Entries' },
          { value: 'insights', label: 'This week' },
        ]}
      />

      {tab === 'entries' ? (
        <>
          <MonthCalendar
            year={view.y}
            month={view.m}
            today={today}
            selected={selected}
            hijriOffset={hijriOffset}
            onSelect={setSelected}
            onMonthChange={(delta) =>
              setView((v) => {
                const m = v.m + delta;
                return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
              })
            }
            renderMark={(day) => (hasContent(entries[dayKey(day)]) ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.ink }} /> : null)}
          />

          <Glass radius={26} padding={18} style={{ gap: 12 }}>
            <Txt variant="title">{longDate(selected)}</Txt>
            {hasContent(sel) ? (
              <>
                {sel!.moods.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {sel!.moods.map((m) => (
                      <Chip key={m} label={MOODS.find((x) => x.key === m)?.label ?? m} />
                    ))}
                  </View>
                )}
                {sel!.reflection ? (
                  <Txt variant="body" tone="soft" numberOfLines={4}>
                    {sel!.reflection}
                  </Txt>
                ) : null}
                <Txt variant="caption" tone="muted">
                  {sel!.deeds.length} good deeds · {sel!.extras.length} extra acts of worship
                </Txt>
              </>
            ) : (
              <Txt variant="body" tone="muted">
                {future ? 'This day hasn’t come yet.' : 'Nothing written for this day yet.'}
              </Txt>
            )}
            {!future && (
              <Press onPress={() => openEntry(selected)} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
                <Chip variant="ink" icon="pencil" label={hasContent(sel) ? 'Edit entry' : 'Write entry'} />
              </Press>
            )}
          </Glass>
        </>
      ) : (
        <>
          <Glass radius={26} padding={18} style={{ gap: 16 }}>
            <Txt variant="title">Last 7 days</Txt>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Stat value={`${week.journaled}/7`} label="Days journaled" />
              <Stat value={`${week.prayers}/35`} label="Prayers marked" />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Stat value={String(week.fasts)} label="Days fasted" />
              <Stat value={String(week.deeds)} label="Good deeds" />
            </View>
          </Glass>

          <Glass radius={26} padding={18} style={{ gap: 12 }}>
            <Txt variant="title">How you felt</Txt>
            {week.moods.length === 0 ? (
              <Txt variant="body" tone="muted">
                Add how you feel in your entries to see patterns here.
              </Txt>
            ) : (
              week.moods.map((m) => (
                <View key={m.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Txt variant="caption" style={{ width: 80 }}>
                    {m.label}
                  </Txt>
                  <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: t.track, overflow: 'hidden' }}>
                    <View style={{ width: `${(m.count / maxMood) * 100}%`, height: '100%', borderRadius: 4, backgroundColor: t.ink }} />
                  </View>
                  <Txt variant="caption" tone="muted" tabular style={{ width: 20, textAlign: 'right' }}>
                    {m.count}
                  </Txt>
                </View>
              ))
            )}
          </Glass>

          {week.extras.length > 0 && (
            <Glass radius={26} padding={18} style={{ gap: 10 }}>
              <Txt variant="title">Extra worship</Txt>
              {week.extras.map((x) => (
                <View key={x.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icon name="circleCheck" size={16} color={t.text} />
                  <Txt variant="body" style={{ flex: 1 }}>
                    {x.label}
                  </Txt>
                  <Txt variant="caption" tone="muted" tabular>
                    {x.count}×
                  </Txt>
                </View>
              ))}
            </Glass>
          )}
          <Txt variant="caption" tone="muted" style={{ textAlign: 'center', paddingHorizontal: 12 }}>
            Your journal stays private on this device.
          </Txt>
        </>
      )}
    </Screen>
  );
}
