import type { DayParts } from '@/lib/dates';

// Jamaat (iqamah) times of a mosque. Pure, so scripts/verify can check it.
export const JAMAAT_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type JamaatPrayer = (typeof JAMAAT_PRAYERS)[number];

/** A fixed clock time ("05:15", 24-hour) or a number of minutes after the adhan. */
export type JamaatRule = { kind: 'fixed'; at: string } | { kind: 'after'; minutes: number };
export type JamaatTimes = Partial<Record<JamaatPrayer, JamaatRule>>;

export const MAX_AFTER_MINUTES = 90;

export const isValidHm = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

/** Keep only well-formed rules, so anything read from a server or typed by hand is safe to use. */
export function sanitizeTimes(input: unknown): JamaatTimes {
  const out: JamaatTimes = {};
  if (!input || typeof input !== 'object') return out;
  for (const p of JAMAAT_PRAYERS) {
    const r = (input as Record<string, unknown>)[p] as { kind?: unknown; at?: unknown; minutes?: unknown } | undefined;
    if (!r || typeof r !== 'object') continue;
    if (r.kind === 'fixed' && typeof r.at === 'string' && isValidHm(r.at)) out[p] = { kind: 'fixed', at: r.at };
    else if (r.kind === 'after' && typeof r.minutes === 'number' && Number.isFinite(r.minutes)) {
      out[p] = { kind: 'after', minutes: Math.min(MAX_AFTER_MINUTES, Math.max(1, Math.round(r.minutes))) };
    }
  }
  return out;
}

export const hasAnyTime = (times: JamaatTimes) => JAMAAT_PRAYERS.some((p) => !!times[p]);

/** Milliseconds the zone is ahead of UTC at this instant. */
function zoneOffsetMs(instant: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const v = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return Date.UTC(v('year'), v('month') - 1, v('day'), v('hour'), v('minute'), v('second')) - Math.floor(instant.getTime() / 1000) * 1000;
}

/** The instant at which the wall clock in `tz` reads `hm` on `day`. */
export function wallTime(day: DayParts, hm: string, tz: string): Date {
  const [h, m] = hm.split(':').map(Number);
  const guess = Date.UTC(day.y, day.m, day.d, h, m);
  const first = guess - zoneOffsetMs(new Date(guess), tz);
  return new Date(guess - zoneOffsetMs(new Date(first), tz));
}

/** When jamaat is held on `day`, given the adhan time. */
export function jamaatAt(rule: JamaatRule, adhan: Date, day: DayParts, tz: string): Date {
  return rule.kind === 'fixed' ? wallTime(day, rule.at, tz) : new Date(adhan.getTime() + rule.minutes * 60_000);
}
