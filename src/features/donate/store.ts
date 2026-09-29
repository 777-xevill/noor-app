import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

// A private log of what you've given. Like the Zakat figures, it stays on this phone and is never
// synced.

export type GiftKind = 'zakat' | 'sadaqah';
export type Gift = { id: string; kind: GiftKind; amount: number; currency: string; day: string; note?: string };

type GivingState = {
  gifts: Gift[];
  add: (gift: Omit<Gift, 'id'>) => void;
  remove: (id: string) => void;
};

export const useGiving = create<GivingState>()(
  persist(
    (set) => ({
      gifts: [],
      add: (gift) => set((s) => ({ gifts: [{ ...gift, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }, ...s.gifts] })),
      remove: (id) => set((s) => ({ gifts: s.gifts.filter((g) => g.id !== id) })),
    }),
    { name: 'noor.giving', storage: persistStorage, version: 1 },
  ),
);

/** Total given of `kind` in `currency` on days in [from, to] (dayKeys, inclusive). */
export function totalGiven(gifts: Gift[], kind: GiftKind, currency: string, from: string, to: string) {
  return gifts.filter((g) => g.kind === kind && g.currency === currency && g.day >= from && g.day <= to).reduce((n, g) => n + g.amount, 0);
}
