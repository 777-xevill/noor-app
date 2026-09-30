import { readCache, writeCache } from '@/lib/diskCache';
import { tafsirToText } from './tafsirText';

// Tafsir is read from Quran.com's API, one ayah at a time, and kept on the phone once opened. It is the
// named scholars' own text, shown as published; Noor doesn't edit or summarise it.
export type Tafsir = { id: number; name: string; author: string; lang: 'bn' | 'en' };

export const TAFSIRS: Tafsir[] = [
  { id: 165, name: 'Tafsir Ahsanul Bayaan', author: 'Bayaan Foundation', lang: 'bn' },
  { id: 166, name: 'Tafsir Abu Bakr Zakaria', author: 'King Fahd Quran Printing Complex', lang: 'bn' },
  { id: 164, name: 'Tafseer Ibn Kathir', author: 'Tawheed Publication', lang: 'bn' },
  { id: 381, name: 'Tafsir Fathul Majid', author: 'AbdulRahman Bin Hasan Al-Alshaikh', lang: 'bn' },
  { id: 169, name: 'Ibn Kathir (Abridged)', author: 'Hafiz Ibn Kathir', lang: 'en' },
  { id: 168, name: 'Ma’arif al-Qur’an', author: 'Mufti Muhammad Shafi', lang: 'en' },
];

const memory = new Map<string, string>();

export async function loadTafsir(id: number, surah: number, ayah: number): Promise<string> {
  const key = `tafsir-${id}-${surah}-${ayah}`;
  const cached = memory.get(key) ?? (await readCache<string>(key));
  if (cached) {
    memory.set(key, cached);
    return cached;
  }
  const res = await fetch(`https://api.quran.com/api/v4/tafsirs/${id}/by_ayah/${surah}:${ayah}`);
  if (!res.ok) throw new Error(`Could not load (${res.status})`);
  const body = (await res.json()) as { tafsir?: { text?: string } };
  const text = tafsirToText(body.tafsir?.text ?? '');
  if (!text) throw new Error('Empty tafsir');
  memory.set(key, text);
  writeCache(key, text);
  return text;
}
