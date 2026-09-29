import type { I18n } from '@/i18n';

/** "just now", "5 min ago", "3 h ago", "2 d ago", then a date. */
export function timeAgo(L: I18n, then: number, now: number) {
  const min = Math.floor((now - then) / 60_000);
  if (min < 1) return L.t('account.justNow');
  if (min < 60) return L.t('account.minAgo', { n: min });
  if (min < 24 * 60) return L.t('account.hAgo', { n: Math.floor(min / 60) });
  if (min < 7 * 24 * 60) return L.t('time.dAgo', { n: Math.floor(min / (24 * 60)) });
  const d = new Date(then);
  return L.shortDate({ y: d.getFullYear(), m: d.getMonth(), d: d.getDate() });
}
