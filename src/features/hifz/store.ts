import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';
import { type HifzItem, itemId, newItem, review } from './srs';

type HifzState = {
  items: HifzItem[];
  add: (surah: number, from: number, to: number, today: string) => void;
  remove: (id: string) => void;
  review: (id: string, remembered: boolean, today: string) => void;
};

export const useHifz = create<HifzState>()(
  persist(
    (set) => ({
      items: [],
      add: (surah, from, to, today) => set((s) => (s.items.some((i) => i.id === itemId(surah, from, to)) ? s : { items: [...s.items, newItem(surah, from, to, today)] })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      review: (id, remembered, today) => set((s) => ({ items: s.items.map((i) => (i.id === id ? review(i, remembered, today) : i)) })),
    }),
    { name: 'noor.hifz', storage: persistStorage, version: 1 },
  ),
);
