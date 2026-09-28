import { addDays, type DayParts, wallDay } from '@/lib/dates';
import { toHijri } from '@/lib/hijri';
import { makeI18n } from '@/i18n/core';
import type { Lang } from '@/i18n/langs';
import type { PrayerLocation } from '@/features/prayer/location';
import type { PrayerPrefs } from '@/features/settings/store';
import { PRAYERS, prayerTimesFor } from '@/features/prayer/times';

// What the home-screen widget shows, computed in the app (the widget runtimes can't run the
// prayer engine or the translations). Every string arrives ready to display.

export type WidgetInput = { loc: PrayerLocation; prefs: PrayerPrefs; hijriOffset: number; lang: Lang };

export type WidgetRow = { name: string; time: string; next: boolean };

export type PrayerWidgetProps = {
  lang: Lang;
  city: string;
  /** e.g. "29 Sep · 18 Rabi' II" — short enough for the medium widget */
  dateLine: string;
  nextLabel: string;
  nextName: string;
  nextTime: string;
  /** When the next prayer begins (ms), for a live countdown. */
  nextAt: number;
  /** The five prayers of the day on display. */
  rows: WidgetRow[];
};

/** The widget as it should look at `at`. */
export function widgetSnapshot(at: Date, { loc, prefs, hijriOffset, lang }: WidgetInput): PrayerWidgetProps {
  const L = makeI18n(lang);
  const today = wallDay(at, loc.timeZone);
  const times = prayerTimesFor(loc, today, prefs, hijriOffset);
  const upcoming = PRAYERS.find((p) => times[p.key] > at);
  // After Isha the next prayer is tomorrow's Fajr, and tomorrow's times are the ones worth showing.
  const day: DayParts = upcoming ? today : addDays(today, 1);
  const shown = upcoming ? times : prayerTimesFor(loc, day, prefs, hijriOffset);
  const nextKey = upcoming?.key ?? 'fajr';
  const hijri = toHijri(day, hijriOffset);

  return {
    lang,
    city: loc.city,
    dateLine: `${L.shortDate(day)} · ${L.num(hijri.day)} ${L.hijriMonth(hijri.month)}`,
    nextLabel: L.t('widget.next'),
    nextName: L.prayer(nextKey, day),
    nextTime: L.clockFull(shown[nextKey], loc.timeZone),
    nextAt: shown[nextKey].getTime(),
    rows: PRAYERS.map((p) => ({ name: L.prayer(p.key, day), time: L.clockFull(shown[p.key], loc.timeZone), next: p.key === nextKey })),
  };
}

/**
 * A timeline for widgets that can be told in advance when to change (iOS): one entry now and one at
 * every prayer time and midnight for the next few days, so the widget moves on by itself.
 */
export function widgetTimeline(now: Date, input: WidgetInput, days = 3): { date: Date; props: PrayerWidgetProps }[] {
  const { loc, prefs, hijriOffset } = input;
  const today = wallDay(now, loc.timeZone);
  const changes = new Set<number>([now.getTime()]);
  for (let i = 0; i <= days; i++) {
    const day = addDays(today, i);
    const t = prayerTimesFor(loc, day, prefs, hijriOffset);
    for (const p of PRAYERS) changes.add(t[p.key].getTime());
    changes.add(midnightBefore(t.fajr, loc.timeZone)); // the date line changes at local midnight
  }
  return [...changes]
    .filter((ms) => ms >= now.getTime())
    .sort((a, b) => a - b)
    .map((ms) => ({ date: new Date(ms), props: widgetSnapshot(new Date(ms), input) }));
}

/** The first instant (to the minute) of `d`'s wall date in `tz`, found by bisection so DST is handled. */
function midnightBefore(d: Date, tz: string): number {
  const p = wallDay(d, tz);
  let lo = d.getTime() - 26 * 3_600_000;
  let hi = d.getTime();
  while (hi - lo > 60_000) {
    const mid = Math.floor((lo + hi) / 2);
    const w = wallDay(new Date(mid), tz);
    if (w.y === p.y && w.m === p.m && w.d === p.d) hi = mid;
    else lo = mid;
  }
  return hi;
}
