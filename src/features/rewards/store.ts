import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

type RewardsState = {
  /** milestone id → dayKey it was first reached. Kept once earned. */
  earned: Record<string, string>;
  /** Earned since the Milestones screen was last opened. */
  unseen: string[];
  record: (ids: string[], dayKey: string) => void;
  markSeen: () => void;
};

export const useRewards = create<RewardsState>()(
  persist(
    (set) => ({
      earned: {},
      unseen: [],
      record: (ids, dayKey) =>
        set((s) => {
          const fresh = ids.filter((id) => !s.earned[id]);
          if (!fresh.length) return s;
          const earned = { ...s.earned };
          for (const id of fresh) earned[id] = dayKey;
          return { earned, unseen: [...s.unseen, ...fresh] };
        }),
      markSeen: () => set({ unseen: [] }),
    }),
    { name: 'noor.rewards', storage: persistStorage, version: 1 },
  ),
);
