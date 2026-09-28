import { CalculationMethod, Coordinates, HighLatitudeRule, Madhab, PrayerTimes, SunnahTimes } from 'adhan';
import { addDays, type DayParts, wallDay } from '@/lib/dates';
import { toHijri } from '@/lib/hijri';
import type { PrayerPrefs } from '@/features/settings/store';
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

/** Label for Dhuhr on Fridays. */
export const prayerLabel = (key: PrayerKey, day: DayParts) =>
  key === 'dhuhr' && new Date(Date.UTC(day.y, day.m, day.d)).getUTCDay() === 5 ? 'Jumu’ah' : PRAYER_LABEL[key];

export type DayTimes = Record<PrayerKey | 'sunrise', Date> & { lastThird: Date; midnight: Date };

const RAMADAN = 8; // 0-based Hijri month index

export function prayerTimesFor(loc: PrayerLocation, day: DayParts, prefs: PrayerPrefs, hijriOffset = 0): DayTimes {
  const coords = new Coordinates(loc.latitude, loc.longitude);
  const params = CalculationMethod[prefs.method]();
  params.madhab = prefs.madhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule =
    prefs.highLatitude === 'middleOfTheNight'
      ? HighLatitudeRule.MiddleOfTheNight
      : prefs.highLatitude === 'seventhOfTheNight'
        ? HighLatitudeRule.SeventhOfTheNight
        : prefs.highLatitude === 'twilightAngle'
          ? HighLatitudeRule.TwilightAngle
          : HighLatitudeRule.recommended(coords);
  // Umm al-Qura: Isha is 120 minutes after Maghrib during Ramadan (90 otherwise).
  if (prefs.method === 'UmmAlQura' && toHijri(day, hijriOffset).month === RAMADAN) params.ishaInterval = 120;
  params.adjustments = { ...params.adjustments, ...prefs.adjustments };

  // adhan reads the calendar day from the Date's local fields; the resulting instants are absolute.
  const pt = new PrayerTimes(coords, new Date(day.y, day.m, day.d), params);
  const sunnah = new SunnahTimes(pt);
  return {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
    midnight: sunnah.middleOfTheNight,
    lastThird: sunnah.lastThirdOfTheNight,
  };
}

export type Schedule = {
  day: DayParts;
  times: DayTimes;
  /** The prayer whose time is running now, or null between midnight and Fajr / sunrise and Dhuhr. */
  current: PrayerKey | null;
  next: { key: PrayerKey; at: Date; tomorrow: boolean };
};

export function scheduleAt(now: Date, loc: PrayerLocation, prefs: PrayerPrefs, hijriOffset = 0): Schedule {
  const day = wallDay(now, loc.timeZone);
  const times = prayerTimesFor(loc, day, prefs, hijriOffset);
  const t = now.getTime();

  let current: PrayerKey | null = null;
  for (const { key } of PRAYERS) if (times[key].getTime() <= t) current = key;
  // Fajr's time ends at sunrise; Dhuhr hasn't started yet.
  if (current === 'fajr' && t >= times.sunrise.getTime()) current = null;

  const upcoming = PRAYERS.find(({ key }) => times[key].getTime() > t);
  const next = upcoming
    ? { key: upcoming.key, at: times[upcoming.key], tomorrow: false }
    : { key: 'fajr' as const, at: prayerTimesFor(loc, addDays(day, 1), prefs, hijriOffset).fajr, tomorrow: true };

  return { day, times, current, next };
}
