import type { WbwSurah, WbwWord } from '@/data/wbw';

// Practice for a lesson: see a word from the surah, pick its meaning. Pure and seeded, so a round
// is stable while it's on screen and the verify script can check it.

export type Question = { word: WbwWord; options: string[]; answer: number };

/** Small deterministic generator (mulberry32). */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rnd: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Up to `count` questions. Each asks for a distinct meaning, and the three wrong options are other
 * meanings from the same surah (from the whole course when a surah is too short), never repeats.
 */
export function buildQuiz(surah: WbwSurah, all: WbwSurah[], lang: 'en' | 'bn', count: number, seed: number): Question[] {
  const rnd = random(seed);
  const meaning = (w: WbwWord) => w[lang].trim();
  const words = surah.ayahs.flatMap((a) => a.words);
  const unique = [...new Map(words.map((w) => [meaning(w), w])).values()];
  const pool = unique.length >= 8 ? unique.map(meaning) : [...new Set(all.flatMap((s) => s.ayahs.flatMap((a) => a.words)).map(meaning))];
  return shuffle(unique, rnd)
    .slice(0, count)
    .map((word) => {
      const right = meaning(word);
      const wrong = shuffle(pool.filter((m) => m !== right), rnd).slice(0, 3);
      const options = shuffle([right, ...wrong], rnd);
      return { word, options, answer: options.indexOf(right) };
    });
}
