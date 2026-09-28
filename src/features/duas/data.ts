import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IconName } from '@/components/Icon';
import type { Key } from '@/i18n/en';
import { DUAS_ASSET } from '@/data/assets';
import { loadDataAsset } from '@/lib/assetData';
import { persistStorage } from '@/lib/storage';

export type Dua = { id: number; ar: string; tr: string; en: string; repeat: number };
export type DuaChapter = { id: number; title: string; duas: Dua[] };

export const loadDuas = () => loadDataAsset<DuaChapter[]>(DUAS_ASSET);

export function useDuas() {
  const [state, setState] = useState<{ data: DuaChapter[] | null; error: Error | null }>({ data: null, error: null });
  useEffect(() => {
    let alive = true;
    loadDuas().then(
      (data) => alive && setState({ data, error: null }),
      (error: Error) => alive && setState({ data: null, error }),
    );
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/**
 * The source sometimes puts an instruction ("Recite Ayat-Al-Kursiy (Al-Baqarah :255)") in the
 * transliteration field. Show those as a note, not as pronunciation.
 */
export const isInstruction = (tr: string) => /^(recite|read|say|then|and)\b/i.test(tr.trim());

/** Everyday chapters, shown first. Ids are Hisnul Muslim chapter numbers on hisnmuslim.com. */
export const FEATURED: { id: number; label: Key; icon: IconName }[] = [
  { id: 27, label: 'duas.f.27', icon: 'sunMoon' },
  { id: 25, label: 'duas.f.25', icon: 'mosque' },
  { id: 28, label: 'duas.f.28', icon: 'moon' },
  { id: 1, label: 'duas.f.1', icon: 'sunrise' },
  { id: 34, label: 'duas.f.34', icon: 'heart' },
  { id: 129, label: 'duas.f.129', icon: 'repeat' },
  { id: 96, label: 'duas.f.96', icon: 'navigation' },
  { id: 69, label: 'duas.f.69', icon: 'handCoins' },
];

type SavedDuas = { saved: string[]; toggle: (key: string) => void };

/** Saved duas, keyed "chapter:dua". */
export const useSavedDuas = create<SavedDuas>()(
  persist(
    (set) => ({
      saved: [],
      toggle: (key) => set((s) => ({ saved: s.saved.includes(key) ? s.saved.filter((k) => k !== key) : [...s.saved, key] })),
    }),
    { name: 'noor.saved-duas', storage: persistStorage, version: 1 },
  ),
);
