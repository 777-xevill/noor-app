import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

type LearnState = {
  /** surah → best practice score, 0–1 */
  best: Record<number, number>;
  record: (surah: number, score: number) => void;
};

export const useLearn = create<LearnState>()(
  persist(
    (set) => ({
      best: {},
      record: (surah, score) => set((s) => ({ best: { ...s.best, [surah]: Math.max(score, s.best[surah] ?? 0) } })),
    }),
    { name: 'noor.learn', storage: persistStorage, version: 1 },
  ),
);

/** A lesson counts as learned once practice reaches this score. */
export const PASS = 0.8;
