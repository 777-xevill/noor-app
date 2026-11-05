// Cross-checks the app's prayer times, Qibla bearings and Hijri dates against an independent
// implementation (api.aladhan.com). Run: npx tsx scripts/verify/verify-religious.ts
import { Coordinates, Qibla } from 'adhan';
import { CITIES } from '../../src/data/cities';
import { addDays, type DayParts, dayKey, formatClock, fromDayKey as fromKey, wallDay } from '../../src/lib/dates';
import { toHijri } from '../../src/lib/hijri';
import { bearingDeg, distanceKm, KAABA } from '../../src/lib/geo';
import { coarseCoord, toPlaces } from '../../src/features/places/overpass';
import { WBW } from '../../src/data/wbw';
import { buildQuiz } from '../../src/features/learn/quiz';
import { checkRequest } from '../../src/features/community/rules';
import { buildIndex, type Passage, search } from '../../src/features/ask/search';
import { cleanAnswer } from '../../src/features/ask/prompts';
import { hijriYearRange } from '../../src/features/donate/period';
import { totalGiven } from '../../src/features/donate/store';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GREETINGS, SHAHADAH } from '../../src/data/phrases';
import { QURAN_EXCERPTS } from '../../src/data/quranExcerpts';
import { PHRASES } from '../../src/features/tasbih/phrases';
import type { CalcMethod, PrayerLocation } from '../../src/features/prayer/location';
import { prayerTimesFor } from '../../src/features/prayer/times';
import { computeStats } from '../../src/features/rewards/milestones';
import { streakOf } from '../../src/features/rewards/streaks';
import { FREEZES_PER_MONTH, addMissedDays, canFreeze, freezesLeft, qadaTotal, skipDays } from '../../src/features/care/rules';
import { NAWAWI } from '../../src/data/nawawi';
import { HADITH_BOOKS } from '../../src/data/hadithIndex';
import { hadithOfTheDay } from '../../src/features/hadith/daily';
import { mergeEditions } from '../../src/features/hadith/merge';
import { tafsirToText } from '../../src/features/quran/tafsirText';
import { RULE_GROUP, parseTajweed, stripTajweed } from '../../src/features/quran/tajweed';
import { RECITERS, DEFAULT_RECITER, ayahAudioUrl } from '../../src/features/quran/reciters';
import { INTERVALS, newItem, review as hifzReview } from '../../src/features/hifz/srs';
import { jamaatAt, sanitizeTimes, wallTime } from '../../src/features/jamaat/rules';
import { isValidCode, juzStates, normalizeCode } from '../../src/features/circle/rules';
import { ALPHABET } from '../../src/data/alphabet';
import { CHECKLIST, HAJJ, HAJJ_REVIEWED, UMRAH } from '../../src/data/hajj';
import { KIDS_DUAS, KIDS_REVIEWED, KIDS_SALAH } from '../../src/data/kidsSalah';
import { CHANNELS } from '../../src/features/lectures/channels';
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
// At high latitude the sun is low at Asr, so the two calculators drift apart. London on 2027-02-20 is the
// widest case: adhan 14:53, aladhan 14:49, and a separate solar-position calculation gives 14:51.7, so
// adhan is the closer of the two and never early.
const HIGH_LAT_ASR_TOLERANCE_MIN = 4;

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

  // Nearby places: directions use the same great-circle bearing as the Qibla, and duplicates collapse.
  const dhakaQibla = Qibla(new Coordinates(dhaka.lat, dhaka.lng));
  const placeList = toPlaces(
    'mosque',
    [
      { type: 'node', id: 1, lat: dhaka.lat + 0.01, lon: dhaka.lng },
      { type: 'node', id: 1, lat: dhaka.lat + 0.01, lon: dhaka.lng },
      { type: 'way', id: 2, center: { lat: dhaka.lat, lon: dhaka.lng + 0.001 } },
    ],
    dhaka.lat,
    dhaka.lng,
  );
  rewardChecks.push(
    ['places: bearing to the Kaaba matches the Qibla', Math.abs(bearingDeg(dhaka.lat, dhaka.lng, KAABA.lat, KAABA.lng) - dhakaQibla) < 0.05],
    ['places: nearest first, duplicates removed, north is 0°', placeList.length === 2 && placeList[0].id === 'way/2' && Math.round(placeList[1].bearing) === 0],
    ['places: servers get a 2 km grid point, within the 1.6 km margin of the real position', coarseCoord(23.8103) === 23.82 && coarseCoord(90.4125) === 90.42 && [[23.8103, 90.4125], [23.8199, 90.4299], [51.5099, -0.1299], [0.0099, 0.0099]].every(([la, ln]) => distanceKm(la, ln, coarseCoord(la), coarseCoord(ln)) <= 1.6)],
  );
  // Lessons: the word-by-word data still spells each ayah of the bundled Tanzil text, letter for letter.
  const letters = (text: string) =>
    text
      .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640\u200c\u200d\ufeff]/g, '')
      .replace(/\u0671/g, '\u0627')
      .replace(/\u0622/g, '\u0627')
      .replace(/[^\u0621-\u064a]/g, '');
  for (const lesson of WBW) {
    const q = JSON.parse(readFileSync(join(root, `assets/data/quran/${lesson.surah}.qdata`), 'utf8')) as { ayahs: { n: number; ar: string }[] };
    const same =
      lesson.ayahs.length === q.ayahs.length &&
      lesson.ayahs.every((a) => letters(a.words.map((w) => w.ar).join('')) === letters(q.ayahs.find((x) => x.n === a.n)?.ar ?? ''));
    rewardChecks.push([`lessons: surah ${lesson.surah} word by word matches the Quran text`, same]);
  }
  const quizOk = WBW.every((lesson) =>
    (['en', 'bn'] as const).every((lang) => {
      const quiz = buildQuiz(lesson, WBW, lang, 8, 7);
      const again = buildQuiz(lesson, WBW, lang, 8, 7);
      return (
        quiz.length === Math.min(8, new Set(lesson.ayahs.flatMap((a) => a.words.map((w) => w[lang].trim()))).size) &&
        quiz.every((qq, i) => new Set(qq.options).size === 4 && qq.options[qq.answer] === qq.word[lang].trim() && again[i].options.join() === qq.options.join())
      );
    }),
  );
  rewardChecks.push(['lessons: every quiz question has one right answer among four distinct options', quizOk]);

  // Dua requests: the posting rules catch links and phone numbers (Latin or Bangla digits).
  const ruleCases: [string, string | null][] = [
    ['Please make dua for my mother’s health', null],
    ['আমার বাবার সুস্থতার জন্য দোয়া করবেন', null],
    ['visit www.example.com for dua', 'links'],
    ['call me 01712-345678', 'phone'],
    ['ফোন ০১৭১২৩৪৫৬৭৮', 'phone'],
    ['hi', 'short'],
  ];
  rewardChecks.push(['community: posting rules catch links, phone numbers and too-short requests', ruleCases.every(([text, want]) => checkRequest(text) === want)]);

  // Ask Noor: retrieval finds the right texts, invented citations are removed, and the prompts that
  // run on the server are the ones reviewed here.
  const passages: Passage[] = [];
  for (let n = 1; n <= 114; n++) {
    const sura = JSON.parse(readFileSync(join(root, `assets/data/quran/${n}.qdata`), 'utf8')) as { ayahs: { n: number; ar: string; en: string; bn: string }[] };
    for (const a of sura.ayahs) passages.push({ tag: `Q ${n}:${a.n}`, kind: 'quran', ar: a.ar, en: a.en, bn: a.bn, surah: n, ayah: a.n });
  }
  const duaBook = JSON.parse(readFileSync(join(root, 'assets/data/duas.qdata'), 'utf8')) as { title: string; duas: { id: number; ar: string; en: string }[] }[];
  for (const c of duaBook) for (const d of c.duas) passages.push({ tag: `D ${d.id}`, kind: 'dua', ar: d.ar, en: d.en, chapter: c.title });
  const idx = buildIndex(passages);
  const patience = search(idx, ['patience', 'patient', 'steadfast', 'prayer'], 8).map((p) => p.tag);
  const sleep = search(idx, ['sleep', 'bed', 'lie down', 'night'], 8);
  const cleaned = cleanAnswer('Be patient [Q 2:153] and pray [Q 99:99]. <b>Also</b> [D 999].\n* Say it 【D 5】 **daily**', ['Q 2:153', 'D 5']);
  const promptsSame = readFileSync(join(root, 'src/features/ask/prompts.ts'), 'utf8') === readFileSync(join(root, 'supabase/functions/ask/prompts.ts'), 'utf8');
  rewardChecks.push(
    ['ask: "patience" finds Al-Baqarah 2:153 or 2:45', patience.includes('Q 2:153') || patience.includes('Q 2:45')],
    ['ask: "sleep" finds a dua for going to sleep', sleep.some((p) => p.kind === 'dua' && /sleep/i.test(p.chapter ?? ''))],
    ['ask: citations not given to the model are removed; odd brackets and markdown cleaned', cleaned.cited.join() === 'Q 2:153,D 5' && cleaned.dropped === 2 && !/<b>|\*|【/.test(cleaned.text) && cleaned.text.includes('• Say it [D 5] daily')],
    ['ask: server prompts are identical to the app’s', promptsSame],
  );

  // Giving: the Zakat year is the Hijri year, and totals count only that year, kind and currency.
  const hy = hijriYearRange({ y: 2026, m: 8, d: 29 }, 0);
  const giftsLog = [
    { id: '1', kind: 'zakat' as const, amount: 500, currency: 'BDT', day: '2026-07-01' },
    { id: '2', kind: 'zakat' as const, amount: 300, currency: 'BDT', day: '2026-06-10' },
    { id: '3', kind: 'sadaqah' as const, amount: 50, currency: 'BDT', day: '2026-07-02' },
    { id: '4', kind: 'zakat' as const, amount: 20, currency: 'USD', day: '2026-07-03' },
  ];
  rewardChecks.push(
    [`giving: Hijri year 1448 runs ${hy.from} to ${hy.to}`, hy.year === 1448 && hy.from === '2026-06-16' && toHijri(fromKey(hy.to)).year === 1448 && toHijri(addDays(fromKey(hy.to), 1)).year === 1449],
    ['giving: Zakat paid this year counts only this year, kind and currency', totalGiven(giftsLog, 'zakat', 'BDT', hy.from, hy.to) === 500],
  );

  // Streaks: excused days and grace days bridge a streak without adding to it or creating one.
  const dk = (n: number) => dayKey(addDays(today, -n));
  const bridged = streakOf([dk(1), dk(3), dk(4)], today, [dk(2)]);
  const skipCases: [string, boolean][] = [
    ['streak: a covered day bridges two runs', bridged.current === 3 && bridged.best === 3 && streakOf([dk(1), dk(3), dk(4)], today).current === 1],
    ['streak: covered days alone make no streak', streakOf([], today, [dk(1), dk(2)]).current === 0],
    ['streak: an excused today keeps the run going', streakOf(run, today, [dayKey(today)]).current === 3],
    ['streak: best run bridges a covered gap', streakOf([dk(10), dk(8)], today, [dk(9)]).best === 2],
  ];
  const oneFreeze: Record<string, true> = { '2026-09-10': true };
  const twoFreezes: Record<string, true> = { '2026-09-10': true, '2026-09-11': true };
  const careChecks: [string, boolean][] = [
    ['care: two grace days a month', FREEZES_PER_MONTH === 2 && freezesLeft(oneFreeze, '2026-09-20') === 1 && freezesLeft(twoFreezes, '2026-09-20') === 0 && freezesLeft(twoFreezes, '2026-10-02') === 2],
    ['care: grace days only cover a past day not already covered', canFreeze(oneFreeze, {}, '2026-09-12', '2026-09-29') && !canFreeze(oneFreeze, {}, '2026-09-29', '2026-09-29') && !canFreeze(oneFreeze, {}, '2026-09-10', '2026-09-29') && !canFreeze(oneFreeze, { '2026-09-12': true }, '2026-09-12', '2026-09-29') && !canFreeze(twoFreezes, {}, '2026-09-12', '2026-09-29')],
    ['care: excused and grace days combine without repeats', skipDays({ a: true, b: true }, { b: true, c: true }).sort().join() === 'a,b,c'],
    ['care: missed days add to all five prayers', qadaTotal(addMissedDays({ fajr: 1, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }, 3)) === 16 && qadaTotal(addMissedDays({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }, -4)) === 0],
  ];

  // Hadith library: the bundled Forty Hadith, the book index, the daily pick and the section merge.
  const merged = mergeEditions(
    { hadiths: [{ hadithnumber: 2, text: 'ar2' }, { hadithnumber: 1, text: 'ar1' }] },
    { hadiths: [{ hadithnumber: 1, text: 'en1', grades: [{ name: 'X', grade: 'Sahih' }] }] },
    { hadiths: [{ hadithnumber: 3, text: ' bn3 ' }, { hadithnumber: 1, text: '' }] },
  );
  const hadithChecks: [string, boolean][] = [
    ['hadith: an-Nawawi has 42 hadith in Arabic, English and Bangla, and the first is about intentions', NAWAWI.length === 42 && NAWAWI.every((h, i) => h.n === i + 1 && h.ar && h.en && h.bn) && letters(NAWAWI[0].ar).includes(letters('بِالنِّيَّاتِ'))],
    ['hadith: eight books, Bukhari ends at 7563 and Nawawi at 42', HADITH_BOOKS.length === 8 && HADITH_BOOKS.find((b) => b.id === 'bukhari')!.sections.at(-1)!.last === 7563 && HADITH_BOOKS.find((b) => b.id === 'nawawi')!.sections.at(-1)!.last === 42 && HADITH_BOOKS.every((b) => b.sections.every((sec, i, all) => sec.first <= sec.last && (i === 0 || sec.n > all[i - 1].n)))],
    ['hadith: the hadith of the day cycles through all 42 and repeats after 42 days', hadithOfTheDay('2026-01-01').n === 1 && hadithOfTheDay('2026-02-12').n === 1 && hadithOfTheDay('2026-09-29').n !== hadithOfTheDay('2026-09-30').n && new Set(Array.from({ length: 42 }, (_, i) => hadithOfTheDay(dayKey(addDays({ y: 2026, m: 4, d: 1 }, i))).n)).size === 42],
    ['hadith: editions join by number; grades come from the English edition; blanks dropped', merged.length === 3 && merged[0].n === 1 && merged[0].ar === 'ar1' && merged[0].en === 'en1' && merged[0].grades?.[0].grade === 'Sahih' && merged[0].bn === undefined && merged[2].bn === 'bn3'],
    ['tafsir: HTML becomes plain paragraphs with entities decoded', tafsirToText('<p>a &amp; b</p><p><b>[1]</b>&nbsp;c<br/>d</p>') === 'a & b\n\n[1] c\nd'],
  ];

  // Whole-Quran word by word and tajweed: every ayah's tajweed text is the Tanzil text with rules laid over it,
  // and the words spell it letter for letter (a few ayahs are spelled with one letter differently by the two sources).
  const hamzaSkeleton = (text: string) =>
    letters(text)
      .replace(/[أإ]/g, 'ا')
      .replace(/ؤ/g, 'و')
      .replace(/[ئى]/g, 'ي')
      .replace(/ء/g, '');
  const editDistance = (a: string, b: string) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  };
  let wbwWords = 0;
  let ayahCount = 0;
  let tajweedExact = true;
  let tajweedCodesOk = true;
  let wordsExact = 0;
  let wordsNear = 0;
  let wordsBad = 0;
  for (let n = 1; n <= 114; n++) {
    const tz = JSON.parse(readFileSync(join(root, `assets/data/quran/${n}.qdata`), 'utf8')) as { ayahs: { n: number; ar: string }[] };
    const ww = JSON.parse(readFileSync(join(root, `assets/data/wbw/${n}.qdata`), 'utf8')) as { a: { n: number; w: string[][]; t: string }[] };
    if (ww.a.length !== tz.ayahs.length) wordsBad++;
    for (const a of ww.a) {
      const src = tz.ayahs.find((x) => x.n === a.n)?.ar ?? '';
      ayahCount++;
      wbwWords += a.w.length;
      if (stripTajweed(a.t) !== src) tajweedExact = false;
      for (const m of a.t.matchAll(/<([a-z])>/g)) if (!(m[1] in RULE_GROUP)) tajweedCodesOk = false;
      if (!parseTajweed(a.t).length) tajweedCodesOk = false;
      const mine = hamzaSkeleton(a.w.map((w) => w[0]).join(''));
      const theirs = hamzaSkeleton(src);
      if (mine === theirs) wordsExact++;
      else if (Math.abs(mine.length - theirs.length) <= 1 && editDistance(mine, theirs) <= 2) wordsNear++;
      else wordsBad++;
    }
  }
  const quranChecks: [string, boolean][] = [
    ['quran-words: 6236 ayahs and 77,429 words, all 114 surahs', ayahCount === 6236 && wbwWords === 77429],
    ['quran-words: every ayah’s words spell the Tanzil text (at most 5 one-letter spelling differences between sources)', wordsBad === 0 && wordsNear <= 5 && wordsExact + wordsNear === 6236],
    ['quran-tajweed: removing the rule marks gives back the Tanzil text exactly, in every ayah', tajweedExact],
    ['quran-tajweed: every rule code is a known rule', tajweedCodesOk],
    ['recitation: twelve reciters, Alafasy is the default, ayah audio URLs are everyayah.com file names', RECITERS.length === 12 && new Set(RECITERS.map((r) => r.id)).size === 12 && RECITERS.some((r) => r.id === DEFAULT_RECITER) && ayahAudioUrl(2, 255, DEFAULT_RECITER) === 'https://everyayah.com/data/Alafasy_128kbps/002255.mp3' && ayahAudioUrl(114, 6, 'Husary_128kbps').endsWith('/114006.mp3')],
  ];

  // Hifz: revise tomorrow, then after 3 days, a week, two weeks and a month; a struggle starts the ladder again.
  const t0 = '2026-09-29';
  let h = newItem(2, 255, 255, t0);
  const gaps: number[] = [];
  for (let i = 0; i < 6; i++) {
    h = hifzReview(h, true, h.due);
    gaps.push(Math.round((Date.parse(h.due) - Date.parse(h.last!)) / 86_400_000));
  }
  const struggled = hifzReview({ ...h, reviews: 4 }, false, t0);
  const hifzChecks: [string, boolean][] = [
    ['hifz: gaps grow 1, 3, 7, 14, 30 days and stay at 30', INTERVALS.join() === '1,3,7,14,30' && gaps.join() === '1,3,7,14,30,30'],
    ['hifz: a new passage is due today; one you struggled with returns tomorrow at the start of the ladder', newItem(1, 1, 7, t0).due === t0 && struggled.reviews === 0 && struggled.due === '2026-09-30'],
  ];

  // Mosque jamaat: clock times are read in the mosque's own zone; times from a server are cleaned before use.
  const dhakaDay: DayParts = { y: 2026, m: 8, d: 29 };
  const adhanAt = new Date('2026-09-29T10:00:00Z');
  const dirty = sanitizeTimes({ fajr: { kind: 'fixed', at: '05:15' }, dhuhr: { kind: 'fixed', at: '25:00' }, asr: { kind: 'after', minutes: 500 }, maghrib: { kind: 'after', minutes: 0 }, isha: { kind: 'nope' }, sunrise: { kind: 'fixed', at: '06:00' } });
  const jamaatChecks: [string, boolean][] = [
    ['jamaat: 05:15 in Dhaka (UTC+6) is 23:15 UTC the evening before, and 13:30 in New York (EDT) is 17:30 UTC', wallTime(dhakaDay, '05:15', 'Asia/Dhaka').toISOString() === '2026-09-28T23:15:00.000Z' && wallTime(dhakaDay, '13:30', 'America/New_York').toISOString() === '2026-09-29T17:30:00.000Z'],
    ['jamaat: "20 minutes after the adhan" and a fixed time', jamaatAt({ kind: 'after', minutes: 20 }, adhanAt, dhakaDay, 'Asia/Dhaka').toISOString() === '2026-09-29T10:20:00.000Z' && jamaatAt({ kind: 'fixed', at: '16:00' }, adhanAt, dhakaDay, 'Asia/Dhaka').toISOString() === '2026-09-29T10:00:00.000Z'],
    ['jamaat: bad times are dropped and minutes are kept within 1 to 90', Object.keys(dirty).join() === 'fajr,asr,maghrib' && (dirty.asr as { minutes: number }).minutes === 90 && (dirty.maghrib as { minutes: number }).minutes === 1],
  ];

  // Family circles: codes avoid look-alike characters; a circle's 30 juz show free, taken and finished.
  const claims = [{ juz: 1, by: 'A', mine: true, done: true }, { juz: 2, by: 'B', mine: false, done: false }, { juz: 3, by: 'C', mine: false, done: true }, { juz: 4, by: 'A', mine: true, done: false }];
  const st = juzStates(claims);
  const circleChecks: [string, boolean][] = [
    ['circle: codes are 6 letters or digits without 0, 1, I or O', normalizeCode(' ab-c d2e3 ') === 'ABCD2E3' && isValidCode('AB2C3D') && !isValidCode('AB0C3D') && !isValidCode('ABIC3D') && !isValidCode('AB2C3') && !isValidCode('ab2c3d')],
    ['circle: 30 juz show free, taken, finished and mine', st.length === 30 && st[0] === 'mineDone' && st[1] === 'taken' && st[2] === 'takenDone' && st[3] === 'mine' && st.slice(4).every((x) => x === 'free')],
  ];

  rewardChecks.push(...skipCases, ...careChecks, ...hadithChecks, ...quranChecks, ...hifzChecks, ...jamaatChecks, ...circleChecks);

  // Hajj, kids and lectures: authored guides stay flagged as unreviewed until a scholar signs off, every dua
  // they point to is a real Hisnul Muslim chapter, and every step has both languages.
  const chapterIds = new Set(duaBook.map((c) => (c as unknown as { id: number }).id));
  const guideSteps = [...UMRAH, ...HAJJ];
  const extraChecks: [string, boolean][] = [
    ['hajj: every step has English and Bangla text, and every dua it points to is a Hisnul Muslim chapter', guideSteps.every((x) => x.en && x.bn && x.textEn.length > 40 && x.textBn.length > 40 && (x.duas ?? []).every((id) => chapterIds.has(id))) && UMRAH.length === 4 && HAJJ.length === 6],
    ['hajj: the guide and kids’ prayer outline are still marked as not reviewed by a scholar', HAJJ_REVIEWED === false && KIDS_REVIEWED === false],
    ['hajj: checklist items are unique and in both languages', new Set(CHECKLIST.map((c) => c.id)).size === CHECKLIST.length && CHECKLIST.every((c) => c.en && c.bn)],
    ['kids: 28 distinct Arabic letters, every prayer step in both languages, every dua chapter exists', ALPHABET.length === 28 && new Set(ALPHABET.map((a) => a.letter)).size === 28 && ALPHABET.every((a) => a.letter.length === 1 && a.letter >= '\u0621' && a.letter <= '\u064a' && a.name && a.nameBn) && KIDS_SALAH.every((x) => x.en && x.bn && x.textEn && x.textBn) && KIDS_DUAS.every((d) => chapterIds.has(d.chapter))],
    ['kids: every letter has an Arabic name to read aloud, and the name starts with that letter', ALPHABET.every((a) => a.ar && (a.letter === 'ا' ? a.ar.startsWith('أ') : a.ar.replace(/[ً-ْ]/g, '').startsWith(a.letter)))],
    ['lectures: every channel is an https YouTube link with a unique id and both languages', new Set(CHANNELS.map((c) => c.id)).size === CHANNELS.length && CHANNELS.every((c) => /^https:\/\/www\.youtube\.com\/@[A-Za-z0-9._-]+$/.test(c.url) && c.about && c.aboutBn)],
  ];
  rewardChecks.push(...extraChecks);

  for (const [label, ok] of rewardChecks) {
    checks++;
    if (!ok) failures++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${/^(widget|sync|places|lessons|community|ask|giving|streak|care|hadith|tafsir|quran-words|quran-tajweed|recitation|hifz|jamaat|circle|hajj|kids|lectures)/.test(label) ? '' : 'milestones: '}${label}`);
  }

  console.log(`\n${checks - failures}/${checks} checks passed`);
  // wallDay sanity across a DST change (London, last Sunday of October 2026)
  const t = new Date(Date.UTC(2026, 9, 25, 23, 30));
  console.log('DST sanity (London 2026-10-25 23:30Z):', wallDay(t, 'Europe/London'), formatClock(t, 'Europe/London'));
  process.exit(failures ? 1 : 0);
}

main();
