import { addDays, type DayParts, daysBetween } from '@/lib/dates';
import { type HijriDate, toHijri } from '@/lib/hijri';
import type { PrayerPrefs } from '@/features/settings/store';
import type { PrayerLocation } from '@/features/prayer/location';
import { prayerTimesFor } from '@/features/prayer/times';

export const RAMADAN = 8; // 0-based Hijri month

export type RamadanDay = { g: DayParts; day: number; sehriEnds: Date; fajr: Date; iftar: Date };

export type RamadanInfo = {
  /** Today's Hijri date */
  today: HijriDate;
  inRamadan: boolean;
  /** Hijri year of the current or next Ramadan */
  year: number;
  /** Gregorian date of 1 Ramadan (current or next) */
  start: DayParts;
  daysUntil: number;
  days: RamadanDay[];
};

/**
 * The current Ramadan, or the next one. Sehri ends at Fajr (minus an optional precaution);
 * Iftar is at Maghrib. Dates follow the Umm al-Qura calendar with the user's moon-sighting offset.
 */
export function ramadanInfo(todayG: DayParts, loc: PrayerLocation, prefs: PrayerPrefs, hijriOffset: number, sehriMargin: number): RamadanInfo {
  const today = toHijri(todayG, hijriOffset);
  const inRamadan = today.month === RAMADAN;

  let start = inRamadan ? addDays(todayG, -(today.day - 1)) : todayG;
  if (!inRamadan) {
    // Walk forward to the next 1 Ramadan (at most a year away).
    for (let i = 0; i < 390; i++) {
      const g = addDays(todayG, i);
      const h = toHijri(g, hijriOffset);
      if (h.month === RAMADAN && h.day === 1) {
        start = g;
        break;
      }
    }
  }
  const year = toHijri(start, hijriOffset).year;

  const days: RamadanDay[] = [];
  for (let i = 0; i < 31; i++) {
    const g = addDays(start, i);
    const h = toHijri(g, hijriOffset);
    if (h.month !== RAMADAN) break;
    const times = prayerTimesFor(loc, g, prefs, hijriOffset);
    days.push({ g, day: h.day, fajr: times.fajr, sehriEnds: new Date(times.fajr.getTime() - sehriMargin * 60_000), iftar: times.maghrib });
  }

  return { today, inRamadan, year, start, daysUntil: Math.max(0, daysBetween(todayG, start)), days };
}
