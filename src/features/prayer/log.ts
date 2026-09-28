import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';
import type { PrayerKey } from './times';

type PrayerLogState = {
  /** dayKey (YYYY-MM-DD, location wall date) → prayers marked as prayed */
  days: Record<string, PrayerKey[]>;
  toggle: (dayKey: string, prayer: PrayerKey) => void;
  replaceAll: (days: Record<string, PrayerKey[]>) => void;
};

export const usePrayerLog = create<PrayerLogState>()(
  persist(
    (set) => ({
      days: {},
      toggle: (dayKey, prayer) =>
        set((s) => {
          const current = s.days[dayKey] ?? [];
          const next = current.includes(prayer) ? current.filter((p) => p !== prayer) : [...current, prayer];
          return { days: { ...s.days, [dayKey]: next } };
        }),
      replaceAll: (days) => set({ days }),
    }),
    { name: 'noor.prayer-log', storage: persistStorage, version: 1 },
  ),
);
