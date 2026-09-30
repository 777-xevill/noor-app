import { NAWAWI, type Nawawi } from '@/data/nawawi';
import { daysBetween, fromDayKey } from '@/lib/dates';

/** One of an-Nawawi's forty-two hadith each day, cycling through the collection in order. Pure, so verify can check it. */
export function hadithOfTheDay(dayKey: string): Nawawi {
  const n = daysBetween({ y: 2026, m: 0, d: 1 }, fromDayKey(dayKey));
  return NAWAWI[((n % NAWAWI.length) + NAWAWI.length) % NAWAWI.length];
}
