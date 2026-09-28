import { useState } from 'react';
import { View } from 'react-native';
import { Glass } from '@/components/Glass';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { daysInMonth, formatClock, MONTHS, sameDay, WEEKDAYS } from '@/lib/dates';
import { METHOD_LABEL } from '@/features/prayer/location';
import { prayerTimesFor } from '@/features/prayer/times';
import { useSchedule } from '@/features/prayer/useSchedule';
import { useTheme } from '@/theme/useTheme';

const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
const HEAD = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export default function TimetableScreen() {
  const t = useTheme();
  const { loc, prefs, hijriOffset, schedule } = useSchedule(60_000);
  const [view, setView] = useState({ y: schedule.day.y, m: schedule.day.m });
  const days = Array.from({ length: daysInMonth(view.y, view.m) }, (_, i) => ({ y: view.y, m: view.m, d: i + 1 }));

  const change = (delta: number) =>
    setView((v) => {
      const m = v.m + delta;
      return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });

  return (
    <Screen gap={14}>
      <ScreenHeader title="Timetable" subtitle={`${loc.city} · ${METHOD_LABEL[prefs.method]} · ${prefs.madhab} Asr`} />
      <Glass radius={22} padding={10} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton icon="chevronLeft" label="Previous month" size={38} onPress={() => change(-1)} />
        <Txt variant="title" style={{ flex: 1, textAlign: 'center' }}>
          {MONTHS[view.m]} {view.y}
        </Txt>
        <IconButton icon="chevronRight" label="Next month" size={38} onPress={() => change(1)} />
      </Glass>

      <Glass radius={22} padding={8}>
        <View style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: t.line }}>
          <Txt variant="micro" tone="muted" style={{ width: 44 }}>
            Date
          </Txt>
          {HEAD.map((h) => (
            <Txt key={h} variant="micro" tone="muted" style={{ flex: 1, textAlign: 'center' }}>
              {h}
            </Txt>
          ))}
        </View>
        {days.map((day) => {
          const times = prayerTimesFor(loc, day, prefs, hijriOffset);
          const today = sameDay(day, schedule.day);
          const friday = new Date(Date.UTC(day.y, day.m, day.d)).getUTCDay() === 5;
          return (
            <View
              key={day.d}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 7,
                paddingHorizontal: 6,
                borderRadius: 12,
                backgroundColor: today ? t.ink : 'transparent',
              }}
            >
              <View style={{ width: 44 }}>
                <Txt variant="caption" tone={today ? 'onInk' : 'default'} tabular>
                  {day.d}
                </Txt>
                <Txt variant="micro" tone={today ? 'onInk' : 'muted'} style={{ fontSize: 10, lineHeight: 12 }}>
                  {friday ? 'Jum' : WEEKDAYS[new Date(Date.UTC(day.y, day.m, day.d)).getUTCDay()].slice(0, 3)}
                </Txt>
              </View>
              {COLS.map((k) => {
                const c = formatClock(times[k], loc.timeZone);
                return (
                  <Txt key={k} variant="caption" tone={today ? 'onInk' : k === 'sunrise' ? 'muted' : 'default'} tabular style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>
                    {c.hm}
                    <Txt variant="micro" tone={today ? 'onInk' : 'muted'} style={{ fontSize: 9 }}>
                      {c.period === 'AM' ? 'a' : 'p'}
                    </Txt>
                  </Txt>
                );
              })}
            </View>
          );
        })}
      </Glass>
      <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
        a = AM, p = PM. Your minute adjustments are included.
      </Txt>
    </Screen>
  );
}
