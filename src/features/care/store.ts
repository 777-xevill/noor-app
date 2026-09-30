import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';
import { addMissedDays, canFreeze, EMPTY_QADA, type QadaCounts, type QadaPrayer } from './rules';

// Deliberately not part of account sync: excused days are private and stay on this phone.
type CareState = {
  womensMode: boolean;
  /** dayKey → excused from prayer (e.g. during a period); such days never break a streak */
  excused: Record<string, true>;
  /** dayKey → a grace day used to cover a missed day */
  freezes: Record<string, true>;
  qada: QadaCounts;
  setWomensMode: (on: boolean) => void;
  toggleExcused: (dayKey: string) => void;
  freeze: (dayKey: string, todayKey: string) => void;
  unfreeze: (dayKey: string) => void;
  adjustQada: (prayer: QadaPrayer, delta: number) => void;
  addMissed: (days: number) => void;
};

export const useCare = create<CareState>()(
  persist(
    (set) => ({
      womensMode: false,
      excused: {},
      freezes: {},
      qada: EMPTY_QADA,
      setWomensMode: (womensMode) => set({ womensMode }),
      toggleExcused: (dayKey) =>
        set((s) => {
          const excused = { ...s.excused };
          if (excused[dayKey]) delete excused[dayKey];
          else excused[dayKey] = true;
          return { excused };
        }),
      freeze: (dayKey, todayKey) =>
        set((s) => (canFreeze(s.freezes, s.excused, dayKey, todayKey) ? { freezes: { ...s.freezes, [dayKey]: true } } : s)),
      unfreeze: (dayKey) =>
        set((s) => {
          const freezes = { ...s.freezes };
          delete freezes[dayKey];
          return { freezes };
        }),
      adjustQada: (prayer, delta) => set((s) => ({ qada: { ...s.qada, [prayer]: Math.max(0, s.qada[prayer] + delta) } })),
      addMissed: (days) => set((s) => ({ qada: addMissedDays(s.qada, days) })),
    }),
    { name: 'noor.care', storage: persistStorage, version: 1 },
  ),
);
