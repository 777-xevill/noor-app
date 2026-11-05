import type { Href } from 'expo-router';
import type { IconName } from '@/components/Icon';
import type { Key } from '@/i18n/en';
import { plusOnSale } from '@/features/premium/store';

/** `label` and `blurb` are translation keys. */
export type Tool = { key: string; label: Key; icon: IconName; href: Href; blurb: Key };

const tool = (key: string, icon: IconName, href: Href): Tool => ({
  key,
  icon,
  href,
  label: `tool.${key}` as Key,
  blurb: `tool.${key}.blurb` as Key,
});

const T = {
  prayers: tool('prayers', 'mosque', '/prayers'),
  quran: tool('quran', 'book', '/quran'),
  qibla: tool('qibla', 'compass', '/qibla'),
  duas: tool('duas', 'dua', '/duas'),
  tasbih: tool('tasbih', 'tasbih', '/tasbih'),
  journal: tool('journal', 'journal', '/journal'),
  tracker: tool('tracker', 'calendarRange', '/tracker'),
  calendar: tool('calendar', 'calendar', '/calendar'),
  timetable: tool('timetable', 'table', '/timetable'),
  zakat: tool('zakat', 'calculator', '/zakat'),
  names: tool('names', 'names', '/names'),
  shahadah: tool('shahadah', 'quote', '/shahadah'),
  greetings: tool('greetings', 'languages', '/greetings'),
  settings: tool('settings', 'settings', '/settings'),
  ramadan: tool('ramadan', 'moonStar', '/ramadan'),
  cards: tool('cards', 'heart', '/cards'),
  milestones: tool('milestones', 'award', '/milestones'),
  mosques: tool('mosques', 'map', '/mosques'),
  learn: tool('learn', 'library', '/learn'),
  community: tool('community', 'dua', '/community'),
  ask: tool('ask', 'help', '/ask'),
  donate: tool('donate', 'handCoins', '/donate'),
  plus: tool('plus', 'sparkles', '/plus'),
  account: tool('account', 'cloud', '/settings/account'),
  recitation: tool('recitation', 'volume', '/recitation'),
  hajj: tool('hajj', 'kaaba', '/hajj'),
  qada: tool('qada', 'repeat', '/qada'),
  hifz: tool('hifz', 'target', '/hifz'),
  circle: tool('circle', 'users', '/circle'),
  lectures: tool('lectures', 'headphones', '/lectures'),
  hadith: tool('hadith', 'scroll', '/hadith'),
  kids: tool('kids', 'star', '/kids'),
};

/** The everyday tools, in the order they appear on Home. */
export const CORE_TOOLS: Tool[] = [T.qibla, T.quran, T.duas, T.tasbih, T.journal, T.calendar, T.zakat, T.names];

// Even counts per group so every row pairs up. Titles are translation keys.
export const TOOL_GROUPS: { title: Key; tools: Tool[] }[] = [
  { title: 'group.worship', tools: [T.prayers, T.timetable, T.quran, T.recitation, T.qibla, T.mosques, T.duas, T.tasbih, T.ramadan, T.hajj] },
  { title: 'group.track', tools: [T.journal, T.tracker, T.qada, T.hifz, T.milestones, T.calendar] },
  { title: 'group.community', tools: [T.ask, T.community, T.circle, T.donate, T.cards, T.lectures] },
  { title: 'group.learn', tools: [T.learn, T.hadith, T.kids, T.names, T.shahadah, T.greetings] },
  { title: 'group.more', tools: plusOnSale ? [T.zakat, T.account, T.plus, T.settings] : [T.account, T.settings] },
];
