import { addDays, type DayParts, dayKey } from '@/lib/dates';
import { toHijri } from '@/lib/hijri';

/** The Hijri year containing `today`, as Gregorian dayKeys from 1 Muharram to its last day. */
export function hijriYearRange(today: DayParts, hijriOffset: number) {
  const year = toHijri(today, hijriOffset).year;
  let from = today;
  while (toHijri(addDays(from, -1), hijriOffset).year === year) from = addDays(from, -1);
  let to = today;
  while (toHijri(addDays(to, 1), hijriOffset).year === year) to = addDays(to, 1);
  return { year, from: dayKey(from), to: dayKey(to) };
}
