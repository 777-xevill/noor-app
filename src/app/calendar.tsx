import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Glass } from '@/components/Glass';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { Txt } from '@/components/Txt';
import { addDays, type DayParts, daysBetween, MONTHS, sameDay, shortDate, weekdayMon0, weekdayName } from '@/lib/dates';
import { HIJRI_MONTHS, toHijri } from '@/lib/hijri';
import { useSchedule } from '@/features/prayer/useSchedule';
import { useTheme } from '@/theme/useTheme';

// Hijri months are 0-based here (0 = Muharram … 11 = Dhu al-Hijjah).
const EVENTS: { m: number; d: number; name: string; note: string }[] = [
  { m: 0, d: 1, name: 'Islamic New Year', note: '1 Muharram' },
  { m: 0, d: 10, name: 'Day of Ashura', note: 'Fasting this day is Sunnah; many also fast the 9th.' },
  { m: 6, d: 27, name: 'Isra and Mi’raj', note: 'The commonly observed date. Historians differ on the exact date.' },
  { m: 7, d: 15, name: 'Mid-Sha’ban', note: 'Observed in many countries, including as Shab-e-Barat in South Asia.' },
  { m: 8, d: 1, name: 'Ramadan begins', note: 'Subject to the sighting of the new moon.' },
  { m: 8, d: 21, name: 'Last ten days of Ramadan', note: 'Seek Laylat al-Qadr in the odd nights. Each night begins at Maghrib the evening before.' },
  { m: 9, d: 1, name: 'Eid al-Fitr', note: 'Subject to the sighting of the new moon.' },
  { m: 11, d: 9, name: 'Day of Arafah', note: 'Fasting is Sunnah for those not performing Hajj.' },
  { m: 11, d: 10, name: 'Eid al-Adha', note: '10 Dhu al-Hijjah' },
];

type HijriMonth = { month: number; year: number; days: { g: DayParts; h: number }[] };

/** All Gregorian days of the Hijri month that contains `anchor`. */
function hijriMonthOf(anchor: DayParts, offset: number): HijriMonth {
  const h = toHijri(anchor, offset);
  let start = addDays(anchor, -(h.day - 1));
  for (let guard = 0; guard < 3 && toHijri(start, offset).month !== h.month; guard++) start = addDays(start, 1);
  const days: HijriMonth['days'] = [];
  for (let i = 0; i < 31; i++) {
    const g = addDays(start, i);
    const hd = toHijri(g, offset);
    if (hd.month !== h.month) break;
    days.push({ g, h: hd.day });
  }
  return { month: h.month, year: h.year, days };
}

export default function CalendarScreen() {
  const t = useTheme();
  const { schedule, hijriOffset } = useSchedule(60_000);
  const today = schedule.day;
  const [anchor, setAnchor] = useState<DayParts>(today);
  const month = useMemo(() => hijriMonthOf(anchor, hijriOffset), [anchor, hijriOffset]);

  const upcoming = useMemo(() => {
    const found: { g: DayParts; name: string; note: string; hijri: string }[] = [];
    for (let i = 0; i < 380 && found.length < 9; i++) {
      const g = addDays(today, i);
      const h = toHijri(g, hijriOffset);
      const ev = EVENTS.find((e) => e.m === h.month && e.d === h.day);
      if (ev) found.push({ g, name: ev.name, note: ev.note, hijri: `${h.day} ${HIJRI_MONTHS[h.month]} ${h.year}` });
    }
    return found;
  }, [today, hijriOffset]);

  const first = month.days[0].g;
  const lead = weekdayMon0(first);
  const cells: (HijriMonth['days'][number] | null)[] = [...Array.from({ length: lead }, () => null), ...month.days];
  while (cells.length % 7) cells.push(null);
  const last = month.days[month.days.length - 1].g;

  return (
    <Screen gap={16}>
      <ScreenHeader title="Islamic calendar" subtitle={`${HIJRI_MONTHS[toHijri(today, hijriOffset).month]} ${toHijri(today, hijriOffset).year} AH`} />

      <Glass radius={26} padding={14} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconButton icon="chevronLeft" label="Previous Hijri month" size={38} onPress={() => setAnchor(addDays(first, -1))} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Txt variant="title">
              {HIJRI_MONTHS[month.month]} {month.year}
            </Txt>
            <Txt variant="caption" tone="muted">
              {shortDate(first)} – {shortDate(last)} {last.y} · {month.days.length} days
            </Txt>
          </View>
          <IconButton icon="chevronRight" label="Next Hijri month" size={38} onPress={() => setAnchor(addDays(last, 1))} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((w, i) => (
            <Txt key={i} variant="micro" tone="muted" style={{ width: `${100 / 7}%`, textAlign: 'center' }}>
              {w}
            </Txt>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 }}>
          {cells.map((c, i) => {
            if (!c) return <View key={i} style={{ width: `${100 / 7}%` }} />;
            const isToday = sameDay(c.g, today);
            const hasEvent = EVENTS.some((e) => e.m === month.month && e.d === c.h);
            return (
              <View key={i} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
                <View
                  style={{
                    width: 40,
                    height: 44,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isToday ? t.ink : hasEvent ? t.pill : 'transparent',
                  }}
                >
                  <Txt variant="bodyStrong" tone={isToday ? 'onInk' : 'default'} tabular style={{ fontSize: 15, lineHeight: 18 }}>
                    {c.h}
                  </Txt>
                  <Txt variant="micro" tone={isToday ? 'onInk' : 'muted'} tabular style={{ fontSize: 9.5, lineHeight: 11 }}>
                    {c.g.d === 1 || i === lead ? `${c.g.d} ${MONTHS[c.g.m].slice(0, 3)}` : c.g.d}
                  </Txt>
                </View>
              </View>
            );
          })}
        </View>
      </Glass>

      <SectionHeader title="Coming up" />
      <Glass radius={26} padding={4}>
        {upcoming.map((e, i) => {
          const days = daysBetween(today, e.g);
          return (
            <View key={e.name + i} style={{ flexDirection: 'row', gap: 12, padding: 14, borderBottomWidth: i < upcoming.length - 1 ? 1 : 0, borderBottomColor: t.line }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Txt variant="title">{e.name}</Txt>
                <Txt variant="caption" tone="muted">
                  {e.hijri} · {weekdayName(e.g)}, {shortDate(e.g)} {e.g.y}
                </Txt>
                <Txt variant="caption" tone="soft">
                  {e.note}
                </Txt>
              </View>
              <Txt variant="caption" tone="soft" tabular>
                {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days} days`}
              </Txt>
            </View>
          );
        })}
      </Glass>
      <Txt variant="caption" tone="muted" style={{ textAlign: 'center', paddingHorizontal: 8 }}>
        Dates are calculated with the Umm al-Qura calendar and your adjustment in Prayer settings. The start of each month depends on local moon sighting.
      </Txt>
    </Screen>
  );
}
