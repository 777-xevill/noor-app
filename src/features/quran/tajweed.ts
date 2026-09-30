// Tajweed markup from Quran.com, laid over the Tanzil text by scripts/data/fetch_data.py (wbw_all).
// An ayah is stored like "خَتَمَ <h>ٱ</>للَّهُ": a one-letter code opens a marked run, "</>" closes it.
// Pure, so scripts/verify can check that removing the marks gives back the Tanzil text exactly.

export type TajweedRule = 'h' | 'l' | 's' | 'm' | 'p' | 'n' | 'o' | 'q' | 'g' | 'k' | 'f' | 'i' | 'd' | 'w' | 'j' | 'r' | 'y';

/** How a rule is drawn. The app is monochrome, so rules differ by weight of mark rather than by colour. */
export type TajweedGroup = 'silent' | 'nasal' | 'madd' | 'qalqalah';

export const RULE_GROUP: Record<TajweedRule, TajweedGroup> = {
  h: 'silent', // hamzat al-wasl
  l: 'silent', // lam shamsiyyah
  s: 'silent', // silent letter
  m: 'madd', // normal madd
  p: 'madd', // permissible madd
  n: 'madd', // necessary madd
  o: 'madd', // obligatory madd
  q: 'qalqalah',
  g: 'nasal', // ghunnah
  k: 'nasal', // ikhfa
  f: 'nasal', // ikhfa shafawi
  i: 'nasal', // iqlab
  d: 'nasal', // idgham with ghunnah
  w: 'nasal', // idgham without ghunnah
  j: 'nasal', // idgham mutajanisayn
  r: 'nasal', // idgham mutaqaribayn
  y: 'nasal', // idgham shafawi
};

export const GROUPS: TajweedGroup[] = ['silent', 'nasal', 'madd', 'qalqalah'];

export type TajweedSegment = { text: string; group?: TajweedGroup };

export function parseTajweed(marked: string): TajweedSegment[] {
  const out: TajweedSegment[] = [];
  const re = /<([a-z])>([^<]*)<\/>|([^<]+)/g;
  for (let m = re.exec(marked); m; m = re.exec(marked)) {
    if (m[3] !== undefined) out.push({ text: m[3] });
    else out.push({ text: m[2], group: RULE_GROUP[m[1] as TajweedRule] });
  }
  return out;
}

export const stripTajweed = (marked: string) => marked.replace(/<[a-z]>|<\/>/g, '');
