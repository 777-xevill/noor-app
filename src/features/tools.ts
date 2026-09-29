import type { Href } from 'expo-router';
import type { IconName } from '@/components/Icon';
import type { Key } from '@/i18n/en';

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
};

/** The everyday tools, in the order they appear on Home. */
export const CORE_TOOLS: Tool[] = [T.qibla, T.quran, T.duas, T.tasbih, T.journal, T.calendar, T.zakat, T.names];

// Even counts per group so every row pairs up. Titles are translation keys.
export const TOOL_GROUPS: { title: Key; tools: Tool[] }[] = [
  { title: 'group.worship', tools: [T.prayers, T.timetable, T.quran, T.qibla, T.mosques, T.duas, T.tasbih, T.ramadan] },
  { title: 'group.track', tools: [T.journal, T.tracker, T.milestones, T.calendar] },
  { title: 'group.learn', tools: [T.names, T.shahadah, T.greetings, T.cards] },
  { title: 'group.more', tools: [T.zakat, T.settings] },
];
