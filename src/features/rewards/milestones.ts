import type { IconName } from '@/components/Icon';
import type { HadithId } from '@/data/hadith';
import { type DayParts, fromDayKey } from '@/lib/dates';
import { toHijri } from '@/lib/hijri';
import type { FastState } from '@/features/fasting/store';
import type { PrayerKey } from '@/features/prayer/times';
import { type Streak, streakOf } from './streaks';

// Pure, so scripts/verify can check it under Node. Hijri months are 0-based.
const MUHARRAM = 0;
const SHAWWAL = 9;
const DHUL_HIJJAH = 11;

export type RewardData = {
  today: DayParts;
  hijriOffset: number;
  prayers: Record<string, PrayerKey[]>;
  /** seconds read per day */
  reading: Record<string, number>;
  dhikr: Record<string, number>;
  /** days with a journal entry */
  journalDays: string[];
  fasts: Record<string, FastState>;
  juzRead: Record<string, boolean>;
  /** excused and grace days: they neither break nor extend the prayer streak */
  skip?: string[];
};

export type StreakKind = 'prayer' | 'quran' | 'dhikr' | 'journal';

export type Stats = {
  streaks: Record<StreakKind, Streak>;
  prayersLogged: number;
  readingMinutes: number;
  dhikrTotal: number;
  fasted: number;
  /** Most fasts kept in a single Shawwal, not counting the day of Eid. */
  shawwal: number;
  arafah: number;
  ashura: number;
  /** Ramadans in which all 30 juz of the reading plan were ticked. */
  khatm: number;
};

const keysWhere = <T,>(record: Record<string, T>, ok: (value: T) => boolean) => Object.keys(record).filter((k) => ok(record[k]));
const sum = (record: Record<string, number>) => Object.values(record).reduce((a, b) => a + b, 0);

export function computeStats(d: RewardData): Stats {
  let shawwal = 0;
  let arafah = 0;
  let ashura = 0;
  const shawwalByYear: Record<number, number> = {};
  for (const key of keysWhere(d.fasts, (v) => v === 'fasted')) {
    const h = toHijri(fromDayKey(key), d.hijriOffset);
    // Fasting on the day of Eid is not permitted, so a fast logged on 1 Shawwal isn't counted.
    if (h.month === SHAWWAL && h.day > 1) shawwal = Math.max(shawwal, (shawwalByYear[h.year] = (shawwalByYear[h.year] ?? 0) + 1));
    if (h.month === DHUL_HIJJAH && h.day === 9) arafah += 1;
    if (h.month === MUHARRAM && h.day === 10) ashura += 1;
  }

  const juzByYear: Record<string, number> = {};
  for (const key of keysWhere(d.juzRead, Boolean)) {
    const year = key.split('-')[0];
    juzByYear[year] = (juzByYear[year] ?? 0) + 1;
  }

  return {
    streaks: {
      prayer: streakOf(keysWhere(d.prayers, (p) => p.length >= 5), d.today, d.skip),
      quran: streakOf(keysWhere(d.reading, (s) => s >= 60), d.today),
      dhikr: streakOf(keysWhere(d.dhikr, (n) => n > 0), d.today),
      journal: streakOf(d.journalDays, d.today),
    },
    prayersLogged: Object.values(d.prayers).reduce((n, p) => n + p.length, 0),
    readingMinutes: Math.floor(sum(d.reading) / 60),
    dhikrTotal: sum(d.dhikr),
    fasted: keysWhere(d.fasts, (v) => v === 'fasted').length,
    shawwal,
    arafah,
    ashura,
    khatm: Object.values(juzByYear).filter((n) => n >= 30).length,
  };
}

export type MilestoneGroup = 'prayer' | 'quran' | 'dhikr' | 'fasting' | 'journal';

export type Milestone = {
  id: string;
  group: MilestoneGroup;
  icon: IconName;
  target: number;
  measure: (s: Stats) => number;
  /** A hadith that explains why this deed matters. */
  hadith?: HadithId;
};

// Titles and descriptions are translation keys: `ms.<id>` and `ms.<id>.d`.
export const MILESTONES: Milestone[] = [
  { id: 'prayerFirstDay', group: 'prayer', icon: 'mosque', target: 1, measure: (s) => s.streaks.prayer.days },
  { id: 'prayerWeek', group: 'prayer', icon: 'flame', target: 7, measure: (s) => s.streaks.prayer.best },
  { id: 'prayerMonth', group: 'prayer', icon: 'flame', target: 30, measure: (s) => s.streaks.prayer.best },
  { id: 'prayer100', group: 'prayer', icon: 'circleCheck', target: 100, measure: (s) => s.prayersLogged },
  { id: 'prayer1000', group: 'prayer', icon: 'star', target: 1000, measure: (s) => s.prayersLogged },

  { id: 'quranFirst', group: 'quran', icon: 'book', target: 1, measure: (s) => s.streaks.quran.days },
  { id: 'quranWeek', group: 'quran', icon: 'flame', target: 7, measure: (s) => s.streaks.quran.best },
  { id: 'quranMonth', group: 'quran', icon: 'flame', target: 30, measure: (s) => s.streaks.quran.best },
  { id: 'quranHours', group: 'quran', icon: 'hourglass', target: 600, measure: (s) => s.readingMinutes },
  { id: 'quranKhatm', group: 'quran', icon: 'bookHeart', target: 1, measure: (s) => s.khatm },

  { id: 'dhikr1k', group: 'dhikr', icon: 'tasbih', target: 1000, measure: (s) => s.dhikrTotal },
  { id: 'dhikr10k', group: 'dhikr', icon: 'tasbih', target: 10000, measure: (s) => s.dhikrTotal },
  { id: 'dhikrWeek', group: 'dhikr', icon: 'flame', target: 7, measure: (s) => s.streaks.dhikr.best },

  { id: 'fastFirst', group: 'fasting', icon: 'moon', target: 1, measure: (s) => s.fasted },
  { id: 'fastShawwal', group: 'fasting', icon: 'moonStar', target: 6, measure: (s) => s.shawwal, hadith: 'shawwal' },
  { id: 'fastArafah', group: 'fasting', icon: 'sunrise', target: 1, measure: (s) => s.arafah, hadith: 'arafah' },
  { id: 'fastAshura', group: 'fasting', icon: 'sunMoon', target: 1, measure: (s) => s.ashura, hadith: 'ashura' },

  { id: 'journalFirst', group: 'journal', icon: 'journal', target: 1, measure: (s) => s.streaks.journal.days },
  { id: 'journalWeek', group: 'journal', icon: 'flame', target: 7, measure: (s) => s.streaks.journal.best },
];

export const MILESTONE_GROUPS: MilestoneGroup[] = ['prayer', 'quran', 'dhikr', 'fasting', 'journal'];
