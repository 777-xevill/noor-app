import { SURAHS } from '@/data/surahs';
import { loadDuas } from '@/features/duas/data';
import { loadSurah } from '@/features/quran/data';
import { buildIndex, type Index, type Passage } from './search';

// Every ayah and every dua the app ships with, indexed once per session.
let pending: Promise<Index> | null = null;

export function loadCorpus(): Promise<Index> {
  pending ??= (async () => {
    const surahs = await Promise.all(SURAHS.map((s) => loadSurah(s.n)));
    const passages: Passage[] = surahs.flatMap((s) =>
      s.ayahs.map((a) => ({ tag: `Q ${s.n}:${a.n}`, kind: 'quran' as const, ar: a.ar, en: a.en, bn: a.bn, surah: s.n, ayah: a.n })),
    );
    for (const c of await loadDuas()) for (const d of c.duas) passages.push({ tag: `D ${d.id}`, kind: 'dua', ar: d.ar, en: d.en, chapter: c.title });
    return buildIndex(passages);
  })();
  pending.catch(() => (pending = null));
  return pending;
}
