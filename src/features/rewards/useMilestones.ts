import { useEffect, useMemo } from 'react';
import { dayKey } from '@/lib/dates';
import { skipDays } from '@/features/care/rules';
import { useCare } from '@/features/care/store';
import { useFasting } from '@/features/fasting/store';
import { hasContent, useJournal } from '@/features/journal/store';
import { usePrayerLog } from '@/features/prayer/log';
import { useSchedule } from '@/features/prayer/useSchedule';
import { useQuranProgress } from '@/features/quran/progress';
import { useRamadan } from '@/features/ramadan/store';
import { useTasbih } from '@/features/tasbih/store';
import { computeStats, MILESTONES, type Milestone } from './milestones';
import { useRewards } from './store';

export type MilestoneState = Milestone & { value: number; done: boolean; earnedOn?: string; isNew: boolean };

/** Current stats and milestones, recording any milestone reached for the first time. */
export function useMilestones() {
  const { schedule, hijriOffset } = useSchedule(60_000);
  const today = schedule.day;
  const prayers = usePrayerLog((s) => s.days);
  const reading = useQuranProgress((s) => s.readingSeconds);
  const dhikr = useTasbih((s) => s.daily);
  const journal = useJournal((s) => s.entries);
  const fasts = useFasting((s) => s.days);
  const juzRead = useRamadan((s) => s.juzRead);
  const excused = useCare((s) => s.excused);
  const freezes = useCare((s) => s.freezes);
  const earned = useRewards((s) => s.earned);
  const unseen = useRewards((s) => s.unseen);
  const record = useRewards((s) => s.record);

  const stats = useMemo(
    () => computeStats({ today, hijriOffset, prayers, reading, dhikr, journalDays: Object.keys(journal).filter((k) => hasContent(journal[k])), fasts, juzRead, skip: skipDays(excused, freezes) }),
    [today, hijriOffset, prayers, reading, dhikr, journal, fasts, juzRead, excused, freezes],
  );

  const reached = MILESTONES.filter((m) => m.measure(stats) >= m.target && !earned[m.id]).map((m) => m.id);
  const todayKey = dayKey(today);
  const pending = reached.join(',');
  useEffect(() => {
    if (pending) record(pending.split(','), todayKey);
  }, [pending, todayKey, record]);

  const milestones: MilestoneState[] = MILESTONES.map((m) => {
    const value = m.measure(stats);
    return { ...m, value, done: value >= m.target || !!earned[m.id], earnedOn: earned[m.id], isNew: unseen.includes(m.id) };
  });
  return { stats, milestones, unseen };
}
