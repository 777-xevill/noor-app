import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

export type FastState = 'fasted' | 'missed';

type FastingState = {
  /** dayKey → fasted, or a missed fast to make up (qada) */
  days: Record<string, FastState>;
  setDay: (dayKey: string, state: FastState | null) => void;
};

export const useFasting = create<FastingState>()(
  persist(
    (set) => ({
      days: {},
      setDay: (dayKey, state) =>
        set((s) => {
          const days = { ...s.days };
          if (state) days[dayKey] = state;
          else delete days[dayKey];
          return { days };
        }),
    }),
    { name: 'noor.fasting', storage: persistStorage, version: 1 },
  ),
);
