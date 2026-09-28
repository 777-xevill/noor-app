import { useMemo } from 'react';
import { useNow } from '@/lib/useNow';
import { useSettings } from '@/features/settings/store';
import { scheduleAt } from './times';

export function useSchedule(tickMs = 10_000) {
  const loc = useSettings((s) => s.location);
  const now = useNow(tickMs);
  const schedule = useMemo(() => scheduleAt(now, loc), [now, loc]);
  return { now, loc, schedule };
}
