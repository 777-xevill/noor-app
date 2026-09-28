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
  /** dayKey → seconds spent in the reader */
  readingSeconds: Record<string, number>;
  goalMinutes: number;
  setLastRead: (lastRead: LastRead) => void;
  toggleBookmark: (key: string) => void;
  addReading: (dayKey: string, seconds: number) => void;
  setGoalMinutes: (minutes: number) => void;
};

export const useQuranProgress = create<QuranProgressState>()(
  persist(
    (set) => ({
      lastRead: null,
      bookmarks: [],
      readingSeconds: {},
      goalMinutes: 10,
      setLastRead: (lastRead) => set({ lastRead }),
      toggleBookmark: (key) =>
        set((s) => ({ bookmarks: s.bookmarks.includes(key) ? s.bookmarks.filter((k) => k !== key) : [...s.bookmarks, key] })),
      addReading: (dayKey, seconds) =>
        set((s) => ({ readingSeconds: { ...s.readingSeconds, [dayKey]: (s.readingSeconds[dayKey] ?? 0) + seconds } })),
      setGoalMinutes: (goalMinutes) => set({ goalMinutes }),
    }),
    { name: 'noor.quran-progress', storage: persistStorage, version: 1 },
  ),
);
