import { NAWAWI } from '@/data/nawawi';
import { readCache, writeCache } from '@/lib/diskCache';
import { type HadithItem, type Raw, mergeEditions } from './merge';

export type { Grade, HadithItem } from './merge';

// The hadith library is read from the fawazahmed0/hadith-api dataset, one book section at a time, and kept
// on the phone once opened. Nothing is retyped: text is shown as the dataset publishes it.
const BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';

/** Translator credits, only where the dataset records one. */
export const HADITH_CREDIT = 'github.com/fawazahmed0/hadith-api. English: Muhsin Khan (Bukhari), Abdul Hamid Siddiqui (Muslim). Bangla and other translations as published in the dataset.';

async function fetchEdition(edition: string, book: string, section: number): Promise<Raw | null> {
  const res = await fetch(`${BASE}/${edition}-${book}/sections/${section}.json`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Could not load (${res.status})`);
  return (await res.json()) as Raw;
}

const memory = new Map<string, HadithItem[]>();

export async function loadSection(book: string, section: number): Promise<HadithItem[]> {
  if (book === 'nawawi') return NAWAWI.map(({ n, ar, en, bn }) => ({ n, ar, en, bn }));
  const key = `hadith-${book}-${section}`;
  const cached = memory.get(key) ?? (await readCache<HadithItem[]>(key));
  if (cached?.length) {
    memory.set(key, cached);
    return cached;
  }
  const [ar, en, bn] = await Promise.all([fetchEdition('ara', book, section), fetchEdition('eng', book, section), fetchEdition('ben', book, section)]);
  const items = mergeEditions(ar, en, bn);
  if (!items.length) throw new Error('Empty section');
  memory.set(key, items);
  writeCache(key, items);
  return items;
}
