import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useNow } from '@/lib/useNow';
import { selectPrayerPrefs, useSettings } from '@/features/settings/store';
import { scheduleAt } from './times';

export function usePrayerContext() {
  const loc = useSettings((s) => s.location);
  const hijriOffset = useSettings((s) => s.hijriOffset);
  const prefs = useSettings(useShallow(selectPrayerPrefs));
  return { loc, prefs, hijriOffset };
}

export function useSchedule(tickMs = 10_000) {
  const { loc, prefs, hijriOffset } = usePrayerContext();
  const now = useNow(tickMs);
  const schedule = useMemo(() => scheduleAt(now, loc, prefs, hijriOffset), [now, loc, prefs, hijriOffset]);
  return { now, loc, prefs, hijriOffset, schedule };
}
