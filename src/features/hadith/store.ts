import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

export type SavedHadith = { id: string; book: string; n: number; ar?: string; en?: string; bn?: string; savedOn: number };

type HadithState = {
  saved: Record<string, SavedHadith>;
  toggle: (h: Omit<SavedHadith, 'id' | 'savedOn'>) => void;
};

export const hadithId = (book: string, n: number) => `${book}:${n}`;

// A copy of the text is kept with each saved hadith so it opens offline.
export const useHadithSaved = create<HadithState>()(
  persist(
    (set) => ({
      saved: {},
      toggle: (h) =>
        set((s) => {
          const id = hadithId(h.book, h.n);
          const saved = { ...s.saved };
          if (saved[id]) delete saved[id];
          else saved[id] = { ...h, id, savedOn: Date.now() };
          return { saved };
        }),
    }),
    { name: 'noor.hadith-saved', storage: persistStorage, version: 1 },
  ),
);
