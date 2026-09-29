// Cross-checks the app's prayer times, Qibla bearings and Hijri dates against an independent
// implementation (api.aladhan.com). Run: npx tsx scripts/verify/verify-religious.ts
import { Coordinates, Qibla } from 'adhan';
import { CITIES } from '../../src/data/cities';
import { addDays, type DayParts, dayKey, formatClock, wallDay } from '../../src/lib/dates';
import { toHijri } from '../../src/lib/hijri';
import { distanceKm } from '../../src/lib/geo';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GREETINGS, SHAHADAH } from '../../src/data/phrases';
import { QURAN_EXCERPTS } from '../../src/data/quranExcerpts';
import { PHRASES } from '../../src/features/tasbih/phrases';
import type { CalcMethod, PrayerLocation } from '../../src/features/prayer/location';
import { prayerTimesFor } from '../../src/features/prayer/times';
import { computeStats } from '../../src/features/rewards/milestones';
import { streakOf } from '../../src/features/rewards/streaks';
import { widgetSnapshot, widgetTimeline } from '../../src/features/widget/snapshot';
import { mergeSyncData, type SyncData } from '../../src/features/sync/merge';

const ALADHAN_METHOD: Partial<Record<CalcMethod, number>> = {
  Karachi: 1,
  NorthAmerica: 2,
  MuslimWorldLeague: 3,
  UmmAlQura: 4,
  Egyptian: 5,
};

const CASES: { city: string; method: CalcMethod; madhab: 'Hanafi' | 'Shafi'; highLatitude?: 'twilightAngle' }[] = [
  { city: 'Dhaka', method: 'Karachi', madhab: 'Hanafi' },
  { city: 'Chattogram', method: 'Karachi', madhab: 'Hanafi' },
  { city: 'Sylhet', method: 'Karachi', madhab: 'Hanafi' },
  { city: 'Karachi', method: 'Karachi', madhab: 'Hanafi' },
  { city: 'Makkah', method: 'UmmAlQura', madhab: 'Shafi' },
  { city: 'Cairo', method: 'Egyptian', madhab: 'Shafi' },
  // Above ~48°N twilight can last all night; compare using the same (angle-based) rule on both sides.
  { city: 'London', method: 'MuslimWorldLeague', madhab: 'Shafi', highLatitude: 'twilightAngle' },
  { city: 'New York', method: 'NorthAmerica', madhab: 'Shafi' },
  { city: 'Kuala Lumpur', method: 'MuslimWorldLeague', madhab: 'Shafi' },
];

const DATES = ['2026-09-29', '2026-12-21', '2027-02-20', '2027-06-21'];
const TOLERANCE_MIN = 2;
// At high latitude the sun is low at Asr, so small differences in how the declination is sampled
// (adhan: at noon; aladhan: at Asr) grow to ~3 minutes. Both are established methods.
const HIGH_LAT_ASR_TOLERANCE_MIN = 3;

const toMin = (hm: string) => {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
};
const clock24 = (d: Date, tz: string) => {
  const c = formatClock(d, tz);
  let [h, m] = c.hm.split(':').map(Number);
  if (c.period === 'PM' && h !== 12) h += 12;
  if (c.period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

async function get(url: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(url, { headers: { 'User-Agent': 'NoorApp-verify/1.0' } });
    if (r.ok) return r.json();
    await new Promise((res) => setTimeout(res, 1500));
  }
  throw new Error('request failed: ' + url);
}

async function main() {
  let failures = 0;
  let checks = 0;

  for (const c of CASES) {
    const city = CITIES.find((x) => x.name === c.city);
    if (!city) throw new Error('city missing: ' + c.city);
    const loc: PrayerLocation = { city: city.name, country: city.country, cc: city.cc, latitude: city.lat, longitude: city.lng, timeZone: city.tz, source: 'city' };
    const prefs = { method: c.method, madhab: c.madhab, highLatitude: c.highLatitude ?? ('auto' as const), adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 } };

    for (const iso of DATES) {
      const [y, m, d] = iso.split('-').map(Number);
      const day = { y, m: m - 1, d };
      const ours = prayerTimesFor(loc, day, prefs);
      const url =
        `https://api.aladhan.com/v1/timings/${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}` +
        `?latitude=${city.lat}&longitude=${city.lng}&method=${ALADHAN_METHOD[c.method]}&school=${c.madhab === 'Hanafi' ? 1 : 0}` +
        `&timezonestring=${encodeURIComponent(city.tz)}&latitudeAdjustmentMethod=3`;
      const ref = (await get(url)).data.timings as Record<string, string>;
      const names: [keyof typeof ours, string][] = [['fajr', 'Fajr'], ['sunrise', 'Sunrise'], ['dhuhr', 'Dhuhr'], ['asr', 'Asr'], ['maghrib', 'Maghrib'], ['isha', 'Isha']];
      const diffs = names.map(([k, rk]) => {
        const diff = clock24(ours[k], city.tz) - toMin(ref[rk].slice(0, 5));
        return { k, diff };
      });
      const worst = diffs.reduce((a, b) => (Math.abs(b.diff) > Math.abs(a.diff) ? b : a));
      checks++;
      const tol = (k: string) => (Math.abs(city.lat) > 45 && k === 'asr' ? HIGH_LAT_ASR_TOLERANCE_MIN : TOLERANCE_MIN);
      const ok = diffs.every(({ k, diff }) => Math.abs(diff) <= tol(String(k)));
      if (!ok) failures++;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.city.padEnd(13)} ${iso} ${c.method.padEnd(18)} worst ${String(worst.k).padEnd(7)} ${worst.diff >= 0 ? '+' : ''}${worst.diff} min`);
      await new Promise((res) => setTimeout(res, 250));
    }

    // Qibla bearing (meaningless within a few km of the Kaaba itself, where any direction "points" at it)
    if (distanceKm(city.lat, city.lng, 21.4225241, 39.8261818) < 25) {
      console.log(`n/a  ${c.city.padEnd(13)} qibla — inside Makkah, face the Kaaba directly`);
      continue;
    }
    const ours = Qibla(new Coordinates(city.lat, city.lng));
    const ref = (await get(`https://api.aladhan.com/v1/qibla/${city.lat}/${city.lng}`)).data.direction as number;
    checks++;
    const qok = Math.abs(ours - ref) < 0.5;
    if (!qok) failures++;
    console.log(`${qok ? 'ok  ' : 'FAIL'} ${c.city.padEnd(13)} qibla ours ${ours.toFixed(2)}° ref ${ref.toFixed(2)}°`);
  }

  // Hijri (Umm al-Qura) against aladhan's UAQ calendar
  for (const iso of ['2026-09-29', '2027-02-08', '2027-03-10', '2027-05-16', '2026-06-16']) {
    const [y, m, d] = iso.split('-').map(Number);
    const h = toHijri({ y, m: m - 1, d });
    const ref = (await get(`https://api.aladhan.com/v1/gToH/${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}?calendarMethod=UAQ`)).data.hijri;
    checks++;
    const ok = h.day === Number(ref.day) && h.month + 1 === ref.month.number && h.year === Number(ref.year);
    if (!ok) failures++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} hijri ${iso} ours ${h.day}/${h.month + 1}/${h.year} ref ${ref.day}/${ref.month.number}/${ref.year}`);
  }

  // Typed Arabic phrases: their letters (ignoring vowel marks and alef/ya spelling variants)
  // must appear in the sourced Hisnul Muslim or Quran text.
  const root = join(__dirname, '..', '..');
  const skeleton = (s: string) =>
    s
      .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/[^ء-ي ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const duas = JSON.parse(readFileSync(join(root, 'assets/data/duas.qdata'), 'utf8')) as { duas: { ar: string }[] }[];
  const parts = duas.flatMap((c) => c.duas.map((d) => d.ar));
  for (let n = 1; n <= 114; n++) {
    const s = JSON.parse(readFileSync(join(root, `assets/data/quran/${n}.qdata`), 'utf8')) as { ayahs: { ar: string }[] };
    parts.push(...s.ayahs.map((a) => a.ar));
  }
  const corpus = ' ' + skeleton(parts.join(' ')) + ' ';
  const phrases = [
    ...PHRASES.map((p) => ({ label: `tasbih: ${p.tr}`, ar: p.ar })),
    ...SHAHADAH.verifyParts.map((ar, i) => ({ label: `shahadah part ${i + 1}`, ar })),
    ...GREETINGS.filter((g) => g.verify).map((g) => ({ label: `greeting: ${g.tr}`, ar: g.ar })),
  ];
  for (const p of phrases) {
    checks++;
    const sk = skeleton(p.ar);
    const whole = corpus.includes(sk);
    // Some correct phrases are worded differently in the sources (e.g. "wa fika barak Allah");
    // then every word must still appear exactly, which is what catches a typo.
    const byWord = !whole && sk.split(' ').every((w) => corpus.includes(` ${w} `));
    const ok = whole || byWord;
    if (!ok) failures++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} phrase ${p.label}${byWord ? ' (each word found)' : ''}`);
  }

  // Quran excerpts shown in the app must be exact prefixes of their ayah, in every language given.
  for (const [name, ex] of Object.entries(QURAN_EXCERPTS)) {
    checks++;
    const s = JSON.parse(readFileSync(join(root, `assets/data/quran/${ex.surah}.qdata`), 'utf8')) as { ayahs: { n: number; ar: string; en: string; bn: string }[] };
    const ayah = s.ayahs.find((a) => a.n === ex.ayah);
    const ok =
      !!ayah &&
      ayah.ar.replace(/^۞ /, '').startsWith(ex.ar) &&
      ayah.en.startsWith(ex.en) &&
      (!('bn' in ex) || ayah.bn.startsWith(ex.bn));
    if (!ok) failures++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} quran excerpt ${name} (${ex.surah}:${ex.ayah})`);
  }

  // The website quotes 24:35 too; it must be the same verified excerpt.
  checks++;
  const site = readFileSync(join(root, 'site/index.html'), 'utf8');
  const siteOk = [QURAN_EXCERPTS.noor.ar, QURAN_EXCERPTS.noor.en, QURAN_EXCERPTS.noor.bn].every((text) => site.includes(text));
  if (!siteOk) failures++;
  console.log(`${siteOk ? 'ok  ' : 'FAIL'} website quotes 24:35 exactly`);

  // Milestones: Sunnah fasts are recognised on the right Hijri days; a fast logged on Eid never counts.
  const hijriDay = (from: DayParts, month: number, day: number) => {
    for (let d = from, i = 0; i < 400; i++, d = addDays(d, 1)) {
      const h = toHijri(d);
      if (h.month === month && h.day === day) return d;
    }
    throw new Error('hijri day not found');
  };
  const start: DayParts = { y: 2026, m: 0, d: 1 };
  const eid = hijriDay(start, 9, 1);
  const arafah = hijriDay(start, 11, 9);
  const ashura = hijriDay(start, 0, 10);
  const fasts: Record<string, 'fasted'> = {};
  for (let i = 0; i < 7; i++) fasts[dayKey(addDays(eid, i))] = 'fasted'; // Eid day + the six after it
  fasts[dayKey(arafah)] = 'fasted';
  fasts[dayKey(addDays(ashura, -1))] = 'fasted'; // 9 Muharram is not Ashura
  fasts[dayKey(ashura)] = 'fasted';
  const stats = computeStats({ today: start, hijriOffset: 0, prayers: {}, reading: {}, dhikr: {}, journalDays: [], fasts, juzRead: {} });
  const today: DayParts = { y: 2026, m: 8, d: 29 };
  const run = [1, 2, 3].map((n) => dayKey(addDays(today, -n)));
  const older = [10, 11, 12, 13, 14].map((n) => dayKey(addDays(today, -n)));
  const rewardChecks: [string, boolean][] = [
    [`six of Shawwal, Eid excluded (Eid ${dayKey(eid)})`, stats.shawwal === 6],
    [`Arafah fast (${dayKey(arafah)})`, stats.arafah === 1],
    [`Ashura fast (${dayKey(ashura)}), 9 Muharram not counted`, stats.ashura === 1],
    ['streak holds until today is done', streakOf(run, today).current === 3],
    ['streak includes today once done', streakOf([...run, dayKey(today)], today).current === 4],
    ['best streak across history', streakOf([...run, ...older], today).best === 5],
    ['broken streak resets', streakOf(older, today).current === 0],
  ];
  // Widget: moves to the next prayer exactly at each prayer time, and to tomorrow's Fajr after Isha.
  const dhaka = CITIES.find((c) => c.name === 'Dhaka')!;
  const wLoc: PrayerLocation = { city: 'Dhaka', country: 'Bangladesh', cc: 'BD', latitude: dhaka.lat, longitude: dhaka.lng, timeZone: dhaka.tz, source: 'city' };
  const wPrefs = { method: 'Karachi' as const, madhab: 'Hanafi' as const, highLatitude: 'auto' as const, adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 } };
  const wInput = { loc: wLoc, prefs: wPrefs, hijriOffset: 0, lang: 'en' as const };
  const wDay: DayParts = { y: 2026, m: 8, d: 29 };
  const wTimes = prayerTimesFor(wLoc, wDay, wPrefs);
  const at = (d: Date, deltaMs: number) => new Date(d.getTime() + deltaMs);
  const before = widgetSnapshot(at(wTimes.asr, -60_000), wInput);
  const onTime = widgetSnapshot(wTimes.asr, wInput);
  const afterIsha = widgetSnapshot(at(wTimes.isha, 60_000), wInput);
  const timeline = widgetTimeline(at(wTimes.fajr, -3_600_000), wInput);
  const rewardChecksWidget: [string, boolean][] = [
    ['widget: Asr is next a minute before Asr', before.nextName === 'Asr' && before.nextAt === wTimes.asr.getTime()],
    ['widget: Maghrib is next from the moment Asr begins', onTime.nextName === 'Maghrib'],
    ["widget: after Isha, tomorrow's Fajr and tomorrow's times", afterIsha.nextName === 'Fajr' && afterIsha.nextAt > wTimes.isha.getTime() && afterIsha.dateLine.startsWith('30 Sep ')],
    ['widget: timeline has an entry at every prayer time', ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].every((k) => timeline.some((e) => e.date.getTime() === wTimes[k as 'fajr'].getTime()))],
    ['widget: timeline changes date at local midnight', timeline.some((e) => e.props.dateLine.startsWith('30 Sep ') && e.date.getTime() < wTimes.isha.getTime() + 6 * 3_600_000 && e.props.nextName === 'Fajr')],
  ];
  rewardChecks.push(...rewardChecksWidget);

  // Sync: when two phones both changed, nothing logged on either side is lost.
  const entry = (text: string, updatedAt: number) => ({ reflection: text, moods: [], extras: [], deeds: [], updatedAt });
  const base = (over: Partial<SyncData>): SyncData => ({
    v: 1,
    settings: { at: 0, value: {} as SyncData['settings']['value'] },
    prayers: {}, reading: {}, lastRead: null, bookmarks: [], goalMinutes: 10, journal: {}, fasts: {}, dhikr: {},
    savedDuas: [], juzRead: {}, taraweeh: {}, earned: {},
    ...over,
  });
  const phoneA = base({
    settings: { at: 100, value: { displayName: 'A' } as SyncData['settings']['value'] },
    prayers: { '2026-09-28': ['fajr', 'dhuhr'] }, reading: { '2026-09-28': 300 }, bookmarks: ['1:1'],
    journal: { '2026-09-28': entry('older', 1) }, earned: { prayerFirstDay: '2026-09-20' }, fasts: { '2026-09-28': 'fasted' },
  });
  const phoneB = base({
    settings: { at: 200, value: { displayName: 'B' } as SyncData['settings']['value'] },
    prayers: { '2026-09-28': ['asr'], '2026-09-27': ['isha'] }, reading: { '2026-09-28': 120 }, bookmarks: ['2:255'],
    journal: { '2026-09-28': entry('newer', 2) }, earned: { prayerFirstDay: '2026-09-10' }, fasts: { '2026-09-28': 'missed' },
  });
  const m = mergeSyncData(phoneA, phoneB);
  const syncChecks: [string, boolean][] = [
    ['sync: logged prayers from both phones kept', m.prayers['2026-09-28'].length === 3 && m.prayers['2026-09-27']?.[0] === 'isha'],
    ['sync: reading time keeps the higher count', m.reading['2026-09-28'] === 300],
    ['sync: journal day keeps its newest edit', m.journal['2026-09-28'].reflection === 'newer'],
    ['sync: settings follow the later change', m.settings.value.displayName === 'B'],
    ['sync: milestone keeps the earliest date', m.earned.prayerFirstDay === '2026-09-10'],
    ['sync: bookmarks from both phones kept', m.bookmarks.length === 2],
    ['sync: a fast recorded on this phone wins', m.fasts['2026-09-28'] === 'fasted'],
  ];
  rewardChecks.push(...syncChecks);
  for (const [label, ok] of rewardChecks) {
    checks++;
    if (!ok) failures++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${/^(widget|sync)/.test(label) ? '' : 'milestones: '}${label}`);
  }

  console.log(`\n${checks - failures}/${checks} checks passed`);
  // wallDay sanity across a DST change (London, last Sunday of October 2026)
  const t = new Date(Date.UTC(2026, 9, 25, 23, 30));
  console.log('DST sanity (London 2026-10-25 23:30Z):', wallDay(t, 'Europe/London'), formatClock(t, 'Europe/London'));
  process.exit(failures ? 1 : 0);
}

main();
