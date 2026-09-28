import { useMemo } from 'react';
import { type DayParts, formatClock } from '@/lib/dates';
import type { HijriDate } from '@/lib/hijri';
import { useSettings } from '@/features/settings/store';
import { bn } from './bn';
import { en, type Key } from './en';
import { type Lang, localDigits } from './langs';

export type { Lang } from './langs';
export { deviceLang, LANGS, localDigits } from './langs';

const DICTS: Record<Lang, Record<Key, string>> = { en, bn };

const NAMES: Record<Lang, { months: string[]; weekdays: string[]; hijri: string[] }> = {
  en: {
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    hijri: ['Muharram', 'Safar', 'Rabi’ I', 'Rabi’ II', 'Jumada I', 'Jumada II', 'Rajab', 'Sha’ban', 'Ramadan', 'Shawwal', 'Dhu al-Qa’dah', 'Dhu al-Hijjah'],
  },
  bn: {
    months: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'],
    weekdays: ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'],
    hijri: ['মহররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জমাদিউল আউয়াল', 'জমাদিউস সানি', 'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'],
  },
};

export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? en[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(typeof v === 'number' ? localDigits(v, lang) : v);
  }
  return s;
}

/** Everything a screen needs to speak the user's language. */
export function makeI18n(lang: Lang) {
  const names = NAMES[lang];
  const t = (key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const num = (v: string | number) => localDigits(v, lang);
  const weekdayOf = (p: DayParts) => new Date(Date.UTC(p.y, p.m, p.d)).getUTCDay();
  return {
    lang,
    t,
    num,
    month: (m: number) => names.months[m],
    monthShort: (m: number) => (lang === 'en' ? names.months[m].slice(0, 3) : names.months[m]),
    weekday: (p: DayParts) => names.weekdays[weekdayOf(p)],
    weekdayShort: (p: DayParts) => (lang === 'en' ? names.weekdays[weekdayOf(p)].slice(0, 3) : names.weekdays[weekdayOf(p)].replace('বার', '')),
    hijriMonth: (m: number) => names.hijri[m],
    hijri: (h: HijriDate) => `${num(h.day)} ${names.hijri[h.month]} ${num(h.year)}`,
    dayMonth: (p: DayParts) => `${num(p.d)} ${names.months[p.m]}`,
    shortDate: (p: DayParts) => `${num(p.d)} ${lang === 'en' ? names.months[p.m].slice(0, 3) : names.months[p.m]}`,
    longDate: (p: DayParts) => `${names.weekdays[weekdayOf(p)]}, ${num(p.d)} ${names.months[p.m]} ${num(p.y)}`,
    clock: (d: Date, tz: string) => {
      const c = formatClock(d, tz);
      return { hm: num(c.hm), period: t(c.period === 'AM' ? 'time.am' : 'time.pm'), short: t(c.period === 'AM' ? 'time.a' : 'time.p') };
    },
    clockFull: (d: Date, tz: string) => {
      const c = formatClock(d, tz);
      return `${num(c.hm)} ${t(c.period === 'AM' ? 'time.am' : 'time.pm')}`;
    },
    countdown: (ms: number) => {
      if (ms <= 30_000) return t('time.now');
      const total = Math.round(ms / 60_000);
      const h = Math.floor(total / 60);
      const m = total % 60;
      if (h === 0) return t('time.m', { m });
      return m === 0 ? t('time.h', { h }) : t('time.hm', { h, m });
    },
    prayer: (key: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', day?: DayParts) =>
      key === 'dhuhr' && day && weekdayOf(day) === 5 ? t('prayer.jumuah') : t(`prayer.${key}` as Key),
  };
}

export type I18n = ReturnType<typeof makeI18n>;

export function useT(): I18n {
  const lang = useSettings((s) => s.language);
  return useMemo(() => makeI18n(lang), [lang]);
}
