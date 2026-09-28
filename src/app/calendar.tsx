import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Glass } from '@/components/Glass';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { Txt } from '@/components/Txt';
import { addDays, type DayParts, daysBetween, sameDay, weekdayMon0 } from '@/lib/dates';
import { toHijri } from '@/lib/hijri';
import { useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { useSchedule } from '@/features/prayer/useSchedule';
import { useTheme } from '@/theme/useTheme';

// Hijri months are 0-based here (0 = Muharram … 11 = Dhu al-Hijjah).
const EVENTS: { m: number; d: number; id: string }[] = [
  { m: 0, d: 1, id: 'newYear' },
  { m: 0, d: 10, id: 'ashura' },
  { m: 6, d: 27, id: 'isra' },
  { m: 7, d: 15, id: 'shaban' },
  { m: 8, d: 1, id: 'ramadan' },
  { m: 8, d: 21, id: 'lastTen' },
  { m: 9, d: 1, id: 'fitr' },
  { m: 11, d: 9, id: 'arafah' },
  { m: 11, d: 10, id: 'adha' },
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
  const L = useT();
  const { schedule, hijriOffset } = useSchedule(60_000);
  const today = schedule.day;
  const [anchor, setAnchor] = useState<DayParts>(today);
  const month = useMemo(() => hijriMonthOf(anchor, hijriOffset), [anchor, hijriOffset]);

  const upcoming = useMemo(() => {
    const found: { g: DayParts; id: string; hijri: string }[] = [];
    for (let i = 0; i < 380 && found.length < 9; i++) {
      const g = addDays(today, i);
      const h = toHijri(g, hijriOffset);
      const ev = EVENTS.find((e) => e.m === h.month && e.d === h.day);
      if (ev) found.push({ g, id: ev.id, hijri: L.hijri(h) });
    }
    return found;
  }, [today, hijriOffset, L]);

  const first = month.days[0].g;
  const lead = weekdayMon0(first);
  const cells: (HijriMonth['days'][number] | null)[] = [...Array.from({ length: lead }, () => null), ...month.days];
  while (cells.length % 7) cells.push(null);
  const last = month.days[month.days.length - 1].g;

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('calendar.title')} subtitle={`${L.hijriMonth(toHijri(today, hijriOffset).month)} ${L.num(toHijri(today, hijriOffset).year)} ${L.t('common.ah')}`} />

      <Glass radius={26} padding={14} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconButton icon="chevronLeft" label={L.t('calendar.prev')} size={38} onPress={() => setAnchor(addDays(first, -1))} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Txt variant="title">
              {L.hijriMonth(month.month)} {L.num(month.year)}
            </Txt>
            <Txt variant="caption" tone="muted">
              {L.shortDate(first)} – {L.shortDate(last)} {L.num(last.y)} · {L.t('calendar.days', { n: month.days.length })}
            </Txt>
          </View>
          <IconButton icon="chevronRight" label={L.t('calendar.next')} size={38} onPress={() => setAnchor(addDays(last, 1))} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => L.t(`wd.${d}` as Key)).map((w, i) => (
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
                    {L.num(c.h)}
                  </Txt>
                  <Txt variant="micro" tone={isToday ? 'onInk' : 'muted'} tabular style={{ fontSize: 9.5, lineHeight: 11 }}>
                    {c.g.d === 1 || i === lead ? L.shortDate(c.g) : L.num(c.g.d)}
                  </Txt>
                </View>
              </View>
            );
          })}
        </View>
      </Glass>

      <SectionHeader title={L.t('calendar.comingUp')} />
      <Glass radius={26} padding={4}>
        {upcoming.map((e, i) => {
          const days = daysBetween(today, e.g);
          return (
            <View key={e.id + i} style={{ flexDirection: 'row', gap: 12, padding: 14, borderBottomWidth: i < upcoming.length - 1 ? 1 : 0, borderBottomColor: t.line }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Txt variant="title">{L.t(`event.${e.id}` as Key)}</Txt>
                <Txt variant="caption" tone="muted">
                  {e.hijri} · {L.weekday(e.g)}, {L.shortDate(e.g)} {L.num(e.g.y)}
                </Txt>
                <Txt variant="caption" tone="soft">
                  {L.t(`event.${e.id}.note` as Key)}
                </Txt>
              </View>
              <Txt variant="caption" tone="soft" tabular>
                {days === 0 ? L.t('common.today') : days === 1 ? L.t('common.tomorrow') : L.t('common.inDays', { n: days })}
              </Txt>
            </View>
          );
        })}
      </Glass>
      <Txt variant="caption" tone="muted" style={{ textAlign: 'center', paddingHorizontal: 8 }}>
        {L.t('calendar.disclaimer')}
      </Txt>
    </Screen>
  );
}
