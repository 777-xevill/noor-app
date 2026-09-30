import { useEffect, useState } from 'react';
import { QURAN_ASSETS, WBW_ASSETS } from '@/data/assets';
import { SURAHS } from '@/data/surahs';
import { loadDataAsset } from '@/lib/assetData';

export type Ayah = {
  n: number;
  /** Uthmani Arabic (Tanzil) */
  ar: string;
  /** Sahih International */
  en: string;
  /** Muhiuddin Khan */
  bn: string;
  /** Transliteration */
  tr: string;
  juz: number;
  page: number;
  sajda?: boolean;
};

export type SurahText = { n: number; ayahs: Ayah[] };

export const surahMeta = (n: number) => SURAHS[n - 1];

export function loadSurah(n: number) {
  return loadDataAsset<SurahText>(QURAN_ASSETS[n - 1]);
}

export function useSurah(n: number) {
  const [state, setState] = useState<{ data: SurahText | null; error: Error | null; n: number }>({ data: null, error: null, n });
  useEffect(() => {
    let alive = true;
    loadSurah(n).then(
      (data) => alive && setState({ data, error: null, n }),
      (error: Error) => alive && setState({ data: null, error, n }),
    );
    return () => {
      alive = false;
    };
  }, [n]);
  // Never show a previous surah's text while the next one loads.
  return state.n === n ? state : { data: null, error: null, n };
}

/** Word-by-word meanings and tajweed markup for one surah (see scripts/data/fetch_data.py, wbw_all). */
export type WordSurah = { n: number; a: { n: number; w: [string, string, string, string][]; t: string }[] };

export function useSurahWords(n: number, enabled: boolean) {
  const [state, setState] = useState<{ data: WordSurah | null; n: number }>({ data: null, n });
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadDataAsset<WordSurah>(WBW_ASSETS[n - 1]).then(
      (data) => alive && setState({ data, n }),
      () => alive && setState({ data: null, n }),
    );
    return () => {
      alive = false;
    };
  }, [n, enabled]);
  return enabled && state.n === n ? state.data : null;
}
