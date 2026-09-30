// Pure: joins the Arabic, English and Bangla editions of a hadith section by hadith number.

export type Grade = { name: string; grade: string };
export type HadithItem = { n: number; ar?: string; en?: string; bn?: string; grades?: Grade[] };

export type Raw = { hadiths: { hadithnumber: number; text: string; grades?: Grade[] }[] };

/** Merge Arabic, English and Bangla editions by hadith number. */
export function mergeEditions(ar: Raw | null, en: Raw | null, bn: Raw | null): HadithItem[] {
  const items = new Map<number, HadithItem>();
  const take = (raw: Raw | null, field: 'ar' | 'en' | 'bn') => {
    for (const h of raw?.hadiths ?? []) {
      const it = items.get(h.hadithnumber) ?? { n: h.hadithnumber };
      const text = h.text.trim();
      if (text) it[field] = text;
      if (field === 'en' && h.grades?.length) it.grades = h.grades;
      items.set(h.hadithnumber, it);
    }
  };
  take(ar, 'ar');
  take(en, 'en');
  take(bn, 'bn');
  return [...items.values()].filter((h) => h.ar || h.en || h.bn).sort((a, b) => a.n - b.n);
}

