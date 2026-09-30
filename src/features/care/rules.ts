// Pure rules for excused days, grace days and missed-prayer counts, so scripts/verify can check them.

export const FREEZES_PER_MONTH = 2;

export const QADA_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type QadaPrayer = (typeof QADA_PRAYERS)[number];
export type QadaCounts = Record<QadaPrayer, number>;

export const EMPTY_QADA: QadaCounts = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

/** Grace days already used in the calendar month of `dayKey` (YYYY-MM-DD). */
export function freezesUsedInMonth(freezes: Record<string, true>, dayKey: string): number {
  const month = dayKey.slice(0, 7);
  return Object.keys(freezes).filter((k) => k.startsWith(month)).length;
}

export function freezesLeft(freezes: Record<string, true>, dayKey: string): number {
  return Math.max(0, FREEZES_PER_MONTH - freezesUsedInMonth(freezes, dayKey));
}

/** A grace day can only cover a past day that isn't already covered, while the month still has one left. */
export function canFreeze(freezes: Record<string, true>, excused: Record<string, true>, dayKey: string, todayKey: string): boolean {
  return dayKey < todayKey && !freezes[dayKey] && !excused[dayKey] && freezesLeft(freezes, dayKey) > 0;
}

/** Days that neither break nor extend a prayer streak. */
export function skipDays(excused: Record<string, true>, freezes: Record<string, true>): string[] {
  return [...new Set([...Object.keys(excused), ...Object.keys(freezes)])];
}

/** `days` missed days of all five prayers, added on top of what is already owed. */
export function addMissedDays(counts: QadaCounts, days: number): QadaCounts {
  const n = Math.max(0, Math.floor(days));
  return { fajr: counts.fajr + n, dhuhr: counts.dhuhr + n, asr: counts.asr + n, maghrib: counts.maghrib + n, isha: counts.isha + n };
}

export const qadaTotal = (counts: QadaCounts) => QADA_PRAYERS.reduce((n, p) => n + counts[p], 0);
