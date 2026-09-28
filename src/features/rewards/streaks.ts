import { addDays, type DayParts, dayKey, daysBetween, fromDayKey } from '@/lib/dates';

export type Streak = { current: number; best: number; days: number };

/**
 * Consecutive qualifying days, ending today — or yesterday while today isn't done yet, so a
 * streak doesn't read as broken in the morning — plus the longest run ever and the total count.
 */
export function streakOf(qualifying: string[], today: DayParts): Streak {
  const set = new Set(qualifying);
  let current = 0;
  let cursor = set.has(dayKey(today)) ? today : addDays(today, -1);
  while (set.has(dayKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  let best = 0;
  let run = 0;
  let prev: DayParts | null = null;
  for (const key of [...set].sort()) {
    const day = fromDayKey(key);
    run = prev && daysBetween(prev, day) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return { current, best, days: set.size };
}
