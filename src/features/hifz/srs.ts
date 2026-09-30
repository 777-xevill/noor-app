import { addDays, dayKey, fromDayKey } from '@/lib/dates';

// Memorisation (hifz) revision on a spaced schedule: a passage you remembered comes back after a longer
// gap each time, and one you struggled with comes back tomorrow. Pure, so scripts/verify can check it.
export const INTERVALS = [1, 3, 7, 14, 30];

export type HifzItem = {
  id: string;
  surah: number;
  from: number;
  to: number;
  /** times remembered in a row */
  reviews: number;
  /** next revision day, YYYY-MM-DD */
  due: string;
  added: string;
  last?: string;
};

export const itemId = (surah: number, from: number, to: number) => `${surah}:${from}-${to}`;

export const newItem = (surah: number, from: number, to: number, today: string): HifzItem => ({ id: itemId(surah, from, to), surah, from, to, reviews: 0, due: today, added: today });

/** Days until the next revision after `reviews` successful revisions in a row. */
export const gapAfter = (reviews: number) => INTERVALS[Math.min(Math.max(reviews, 1), INTERVALS.length) - 1];

export function review(item: HifzItem, remembered: boolean, today: string): HifzItem {
  const reviews = remembered ? item.reviews + 1 : 0;
  const days = remembered ? gapAfter(reviews) : 1;
  return { ...item, reviews, last: today, due: dayKey(addDays(fromDayKey(today), days)) };
}

export const isDue = (item: HifzItem, today: string) => item.due <= today;
