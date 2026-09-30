// Pure rules for family circles (supabase/migrations/0006_circles.sql), so scripts/verify can check them.
export const JUZ_COUNT = 30;
/** The code alphabet leaves out 0, 1, I and O, which are easy to mix up when read aloud. */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export type JuzClaim = { juz: number; by: string; mine: boolean; done: boolean };

/** Tidy what someone typed for a code: capitals, no spaces or dashes. */
export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const isValidCode = (s: string) => new RegExp(`^[${CODE_ALPHABET}]{6}$`).test(s);

export type JuzState = 'free' | 'mine' | 'mineDone' | 'taken' | 'takenDone';

export function juzStates(claims: JuzClaim[]): JuzState[] {
  return Array.from({ length: JUZ_COUNT }, (_, i) => {
    const c = claims.find((x) => x.juz === i + 1);
    if (!c) return 'free';
    if (c.mine) return c.done ? 'mineDone' : 'mine';
    return c.done ? 'takenDone' : 'taken';
  });
}

export const juzDone = (claims: JuzClaim[]) => claims.filter((c) => c.done).length;
export const juzFree = (claims: JuzClaim[]) => JUZ_COUNT - claims.length;
export const isComplete = (claims: JuzClaim[]) => juzDone(claims) >= JUZ_COUNT;
