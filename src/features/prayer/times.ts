import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan';
import { addDays, type DayParts, wallDay } from '@/lib/dates';
import type { PrayerLocation } from './location';

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export const PRAYERS: { key: PrayerKey; label: string }[] = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
];

export const PRAYER_LABEL: Record<PrayerKey, string> = Object.fromEntries(PRAYERS.map((p) => [p.key, p.label])) as Record<
  PrayerKey,
  string
>;

export type DayTimes = Record<PrayerKey | 'sunrise', Date>;

export function prayerTimesFor(loc: PrayerLocation, day: DayParts): DayTimes {
  const params = CalculationMethod[loc.method]();
  params.madhab = loc.madhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  // adhan reads the calendar day from the Date's local fields; the result instants are absolute.
  const pt = new PrayerTimes(new Coordinates(loc.latitude, loc.longitude), new Date(day.y, day.m, day.d), params);
  return { fajr: pt.fajr, sunrise: pt.sunrise, dhuhr: pt.dhuhr, asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha };
}

export type Schedule = {
  day: DayParts;
  times: DayTimes;
  /** The prayer whose time is running now, or null between midnight and Fajr / sunrise and Dhuhr. */
  current: PrayerKey | null;
  next: { key: PrayerKey; at: Date; tomorrow: boolean };
};

export function scheduleAt(now: Date, loc: PrayerLocation): Schedule {
  const day = wallDay(now, loc.utcOffsetMinutes);
  const times = prayerTimesFor(loc, day);
  const t = now.getTime();

  let current: PrayerKey | null = null;
  for (const { key } of PRAYERS) if (times[key].getTime() <= t) current = key;
  // Fajr's time ends at sunrise; Dhuhr hasn't started yet.
  if (current === 'fajr' && t >= times.sunrise.getTime()) current = null;

  const upcoming = PRAYERS.find(({ key }) => times[key].getTime() > t);
  const next = upcoming
    ? { key: upcoming.key, at: times[upcoming.key], tomorrow: false }
    : { key: 'fajr' as const, at: prayerTimesFor(loc, addDays(day, 1)).fajr, tomorrow: true };

  return { day, times, current, next };
}
