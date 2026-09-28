import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

export type TasbihMode = 'free' | 'afterPrayer';

type TasbihState = {
  mode: TasbihMode;
  phraseId: string;
  /** 0 = no target (count freely) */
  target: number;
  count: number;
  rounds: number;
  /** Step within the after-prayer sequence */
  step: number;
  /** dayKey → total counted that day */
  daily: Record<string, number>;
  set: (patch: Partial<Omit<TasbihState, 'set' | 'addDaily'>>) => void;
  addDaily: (dayKey: string) => void;
};

export const useTasbih = create<TasbihState>()(
  persist(
    (set) => ({
      mode: 'free',
      phraseId: 'subhanallah',
      target: 33,
      count: 0,
      rounds: 0,
      step: 0,
      daily: {},
      set: (patch) => set(patch),
      addDaily: (dayKey) => set((s) => ({ daily: { ...s.daily, [dayKey]: (s.daily[dayKey] ?? 0) + 1 } })),
    }),
    { name: 'noor.tasbih', storage: persistStorage, version: 1 },
  ),
);
