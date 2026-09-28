import type { DayParts } from './dates';

export type HijriDate = { day: number; month: number; year: number }; // month is 0-based

export const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi’ I',
  'Rabi’ II',
  'Jumada I',
  'Jumada II',
  'Rajab',
  'Sha’ban',
  'Ramadan',
  'Shawwal',
  'Dhu al-Qa’dah',
  'Dhu al-Hijjah',
];

// Prefer the platform's Umm al-Qura calendar. Some JS engines (e.g. Hermes builds without
// full ICU) don't ship it, so fall back to the tabular Islamic calendar, which can differ by a day.
function viaIntl(p: DayParts): HijriDate | null {
  try {
    const fmt = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
    if (!fmt.resolvedOptions().calendar.startsWith('islamic')) return null;
    const parts = fmt.formatToParts(new Date(Date.UTC(p.y, p.m, p.d, 12)));
    const num = (type: string) => parseInt(parts.find((x) => x.type === type)?.value ?? '', 10);
    const day = num('day');
    const month = num('month');
    const year = num('year') || num('relatedYear');
    if (!day || !month || !year) return null;
    return { day, month: month - 1, year };
  } catch {
    return null;
  }
}

function gregorianToJD(y: number, m1: number, d: number) {
  if (m1 < 3) {
    y -= 1;
    m1 += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m1 + 1)) + d + b - 1524.5;
}

const ISLAMIC_EPOCH = 1948439.5;
const islamicToJD = (y: number, m1: number, d: number) =>
  d + Math.ceil(29.5 * (m1 - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + ISLAMIC_EPOCH - 1;

function tabular(p: DayParts): HijriDate {
  const jd = Math.floor(gregorianToJD(p.y, p.m + 1, p.d)) + 0.5;
  const year = Math.floor((30 * (jd - ISLAMIC_EPOCH) + 10646) / 10631);
  const month1 = Math.min(12, Math.ceil((jd - (29 + islamicToJD(year, 1, 1))) / 29.5) + 1);
  const day = jd - islamicToJD(year, month1, 1) + 1;
  return { day, month: month1 - 1, year };
}

/** `adjustDays` lets users follow local moon sighting (Bangladesh is often one day behind Umm al-Qura). */
export function toHijri(p: DayParts, adjustDays = 0): HijriDate {
  const t = new Date(Date.UTC(p.y, p.m, p.d + adjustDays));
  const q = { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() };
  return viaIntl(q) ?? tabular(q);
}

export const formatHijri = (h: HijriDate) => `${h.day} ${HIJRI_MONTHS[h.month]} ${h.year}`;
