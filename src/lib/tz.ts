// Time-zone offsets for any IANA zone, including daylight saving, via Intl.
// Prayer times are shown in the chosen place's local time, not the device's.

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** Minutes to add to UTC to get the wall-clock time in `timeZone` at `date`. */
export function tzOffsetMinutes(date: Date, timeZone: string): number {
  try {
    const parts = formatterFor(timeZone).formatToParts(date);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const hour = get('hour') % 24;
    const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
    const whole = Math.floor(date.getTime() / 1000) * 1000;
    const offset = Math.round((asUTC - whole) / 60_000);
    if (Number.isFinite(offset)) return offset;
  } catch {}
  // Engine without time-zone data: fall back to the device's own offset.
  return -date.getTimezoneOffset();
}

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
