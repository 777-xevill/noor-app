import { tzOffsetMinutes } from './tz';

// All "wall clock" maths happens in the prayer location's time zone, so a Dhaka schedule
// reads the same on any device. A shifted Date's UTC fields hold the location's wall time.

export type DayParts = { y: number; m: number; d: number }; // m is 0-based

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const shift = (date: Date, tz: string) => new Date(date.getTime() + tzOffsetMinutes(date, tz) * 60_000);

export function wallDay(date: Date, tz: string): DayParts {
  const s = shift(date, tz);
  return { y: s.getUTCFullYear(), m: s.getUTCMonth(), d: s.getUTCDate() };
}

export function addDays(p: DayParts, days: number): DayParts {
  const t = new Date(Date.UTC(p.y, p.m, p.d + days));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() };
}

export const sameDay = (a: DayParts, b: DayParts) => a.y === b.y && a.m === b.m && a.d === b.d;

export const dayKey = (p: DayParts) => `${p.y}-${String(p.m + 1).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;

export function fromDayKey(key: string): DayParts {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m: m - 1, d };
}

/** Days between two calendar dates (b − a). */
export const daysBetween = (a: DayParts, b: DayParts) => Math.round((Date.UTC(b.y, b.m, b.d) - Date.UTC(a.y, a.m, a.d)) / 86_400_000);

/** 0 = Monday … 6 = Sunday */
export const weekdayMon0 = (p: DayParts) => (new Date(Date.UTC(p.y, p.m, p.d)).getUTCDay() + 6) % 7;

export const weekdayName = (p: DayParts) => WEEKDAYS[new Date(Date.UTC(p.y, p.m, p.d)).getUTCDay()];
export const monthName = (p: DayParts) => MONTHS[p.m];
export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

export function formatClock(date: Date, tz: string): { hm: string; period: 'AM' | 'PM' } {
  const s = shift(date, tz);
  const h24 = s.getUTCHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hm: `${h12}:${String(s.getUTCMinutes()).padStart(2, '0')}`, period: h24 < 12 ? 'AM' : 'PM' };
}

export const formatClockFull = (date: Date, tz: string) => {
  const c = formatClock(date, tz);
  return `${c.hm} ${c.period}`;
};

export function formatCountdown(ms: number): string {
  if (ms <= 30_000) return 'now';
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export const shortDate = (p: DayParts) => `${p.d} ${MONTHS[p.m].slice(0, 3)}`;
export const longDate = (p: DayParts) => `${weekdayName(p)}, ${p.d} ${MONTHS[p.m]} ${p.y}`;
