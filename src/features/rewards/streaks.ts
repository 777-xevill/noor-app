import { addDays, type DayParts, dayKey, daysBetween, fromDayKey } from '@/lib/dates';

export type Streak = { current: number; best: number; days: number };

/**
 * Consecutive qualifying days, ending today — or yesterday while today isn't done yet, so a
 * streak doesn't read as broken in the morning — plus the longest run ever and the total count.
 * `skip` days (excused days, grace days) neither break a streak nor add to it.
 */
export function streakOf(qualifying: string[], today: DayParts, skip: string[] = []): Streak {
  const set = new Set(qualifying);
  const skipped = new Set(skip);
  const covered = (d: DayParts) => skipped.has(dayKey(d));

  let current = 0;
  let cursor = set.has(dayKey(today)) || covered(today) ? today : addDays(today, -1);
  for (;;) {
    if (set.has(dayKey(cursor))) current += 1;
    else if (!covered(cursor)) break;
    cursor = addDays(cursor, -1);
    if (daysBetween(cursor, today) > 4000) break;
  }

  let best = 0;
  let run = 0;
  let prev: DayParts | null = null;
  for (const key of [...set].sort()) {
    const day = fromDayKey(key);
    let joined = false;
    if (prev) {
      const gap = daysBetween(prev, day);
      joined = gap === 1;
      if (gap > 1 && gap <= 4000) {
        joined = true;
        for (let i = 1; i < gap; i++) if (!covered(addDays(prev, i))) joined = false;
      }
    }
    run = joined ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return { current, best, days: set.size };
}
