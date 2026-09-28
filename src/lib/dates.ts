// All "wall clock" maths happens in the prayer location's UTC offset, so a Dhaka schedule
// reads the same on any device. A shifted Date's UTC fields hold the location's wall time.

export type DayParts = { y: number; m: number; d: number }; // m is 0-based

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const shift = (date: Date, offsetMin: number) => new Date(date.getTime() + offsetMin * 60_000);

export function wallDay(date: Date, offsetMin: number): DayParts {
  const s = shift(date, offsetMin);
  return { y: s.getUTCFullYear(), m: s.getUTCMonth(), d: s.getUTCDate() };
}

export function addDays(p: DayParts, days: number): DayParts {
  const t = new Date(Date.UTC(p.y, p.m, p.d + days));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() };
}

export const dayKey = (p: DayParts) => `${p.y}-${String(p.m + 1).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;

/** 0 = Monday … 6 = Sunday */
export const weekdayMon0 = (p: DayParts) => (new Date(Date.UTC(p.y, p.m, p.d)).getUTCDay() + 6) % 7;

export const weekdayName = (p: DayParts) => WEEKDAYS[new Date(Date.UTC(p.y, p.m, p.d)).getUTCDay()];
export const monthName = (p: DayParts) => MONTHS[p.m];

export function formatClock(date: Date, offsetMin: number): { hm: string; period: 'AM' | 'PM' } {
  const s = shift(date, offsetMin);
  const h24 = s.getUTCHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hm: `${h12}:${String(s.getUTCMinutes()).padStart(2, '0')}`, period: h24 < 12 ? 'AM' : 'PM' };
}

export function formatCountdown(ms: number): string {
  if (ms <= 30_000) return 'now';
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
