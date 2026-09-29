// Finds the passages an answer may draw on: Quran ayahs (Saheeh International and Muhiuddin Khan)
// and Hisnul Muslim duas. Plain BM25 over the translations. Pure, so verify can test it.

export type Passage = {
  /** How the answer cites it: "Q 2:153" or "D 45". */
  tag: string;
  kind: 'quran' | 'dua';
  ar: string;
  en: string;
  bn?: string;
  surah?: number;
  ayah?: number;
  /** Hisnul Muslim chapter title, for duas. */
  chapter?: string;
};

const STOP = new Set(
  'a an and are as at be by for from has have he her his i in is it its me my of on or our she so that the their them they this to us was we were what when which who will with you your do does did how why not no nor all any also than then there these those into upon unto shall would should can could may might o whom whose one ones'.split(
    ' ',
  ),
);

/** Lower-case words, stop words out, light stemming so "prayers" meets "prayer". */
export function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{M}]+/gu) ?? [])
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (/^[a-z]+$/.test(w) ? w.replace(/(ing|ed|es|s)$/, '').replace(/(.)\1$/, '$1') || w : w));
}

export type Index = { passages: Passage[]; docs: string[][]; df: Map<string, number>; avg: number };

export function buildIndex(passages: Passage[]): Index {
  const docs = passages.map((p) => tokens(`${p.en} ${p.bn ?? ''} ${p.chapter ?? ''}`));
  const df = new Map<string, number>();
  for (const d of docs) for (const w of new Set(d)) df.set(w, (df.get(w) ?? 0) + 1);
  const avg = docs.reduce((n, d) => n + d.length, 0) / Math.max(1, docs.length);
  return { passages, docs, df, avg };
}

/** The best `limit` passages for these search words, best first. */
export function search(index: Index, words: string[], limit = 8): Passage[] {
  const query = [...new Set(words.flatMap(tokens))];
  if (!query.length) return [];
  const N = index.docs.length;
  const k1 = 1.2;
  const b = 0.75;
  const scored: { i: number; s: number }[] = [];
  index.docs.forEach((doc, i) => {
    let s = 0;
    for (const q of query) {
      const tf = doc.reduce((n, w) => n + (w === q ? 1 : 0), 0);
      if (!tf) continue;
      const df = index.df.get(q) ?? 0;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      s += (idf * tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * doc.length) / index.avg));
    }
    if (s > 0) scored.push({ i, s });
  });
  return scored
    .sort((x, y) => y.s - x.s)
    .slice(0, limit)
    .map(({ i }) => index.passages[i]);
}
