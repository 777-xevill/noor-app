import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

export type LastRead = {
  surahNumber: number;
  surah: string;
  surahMeaning: string;
  ayah: number;
  totalAyahs: number;
};

type QuranProgressState = {
  lastRead: LastRead | null;
  /** Bookmarked verse keys, e.g. "94:5". */
  bookmarks: string[];
  setLastRead: (lastRead: LastRead) => void;
  toggleBookmark: (key: string) => void;
};

export const useQuranProgress = create<QuranProgressState>()(
  persist(
    (set) => ({
      lastRead: null,
      bookmarks: [],
      setLastRead: (lastRead) => set({ lastRead }),
      toggleBookmark: (key) =>
        set((s) => ({ bookmarks: s.bookmarks.includes(key) ? s.bookmarks.filter((k) => k !== key) : [...s.bookmarks, key] })),
    }),
    { name: 'noor.quran-progress', storage: persistStorage, version: 1 },
  ),
);
