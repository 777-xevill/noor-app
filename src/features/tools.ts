import type { Href } from 'expo-router';
import type { IconName } from '@/components/Icon';

export type Tool = { key: string; label: string; icon: IconName; href: Href; blurb: string };

const T = {
  prayers: { key: 'prayers', label: 'Prayers', icon: 'mosque', href: '/prayers', blurb: 'Times, alerts and tracking' },
  quran: { key: 'quran', label: 'Quran', icon: 'book', href: '/quran', blurb: 'Read, listen and bookmark' },
  qibla: { key: 'qibla', label: 'Qibla', icon: 'compass', href: '/qibla', blurb: 'Direction of the Kaaba' },
  duas: { key: 'duas', label: 'Duas', icon: 'dua', href: '/duas', blurb: 'Hisnul Muslim adhkar' },
  tasbih: { key: 'tasbih', label: 'Tasbih', icon: 'tasbih', href: '/tasbih', blurb: 'Count your dhikr' },
  journal: { key: 'journal', label: 'Journal', icon: 'journal', href: '/journal', blurb: 'Reflect on your day' },
  tracker: { key: 'tracker', label: 'Tracker', icon: 'calendarRange', href: '/tracker', blurb: 'Prayers and fasts by month' },
  calendar: { key: 'calendar', label: 'Calendar', icon: 'calendar', href: '/calendar', blurb: 'Hijri months and key dates' },
  timetable: { key: 'timetable', label: 'Timetable', icon: 'table', href: '/timetable', blurb: 'Monthly prayer times' },
  zakat: { key: 'zakat', label: 'Zakat', icon: 'calculator', href: '/zakat', blurb: 'Calculate what’s due' },
  names: { key: 'names', label: '99 Names', icon: 'names', href: '/names', blurb: 'Al-Asma’ al-Husna' },
  shahadah: { key: 'shahadah', label: 'Shahadah', icon: 'quote', href: '/shahadah', blurb: 'The declaration of faith' },
  greetings: { key: 'greetings', label: 'Greetings', icon: 'languages', href: '/greetings', blurb: 'Phrases and when to say them' },
  settings: { key: 'settings', label: 'Settings', icon: 'settings', href: '/settings', blurb: 'Location, method, appearance' },
} satisfies Record<string, Tool>;

/** The everyday tools, in the order they appear on Home. */
export const CORE_TOOLS: Tool[] = [T.qibla, T.quran, T.duas, T.tasbih, T.journal, T.calendar, T.zakat, T.names];

// Even counts per group so every row pairs up.
export const TOOL_GROUPS: { title: string; tools: Tool[] }[] = [
  { title: 'Worship', tools: [T.prayers, T.quran, T.qibla, T.duas, T.tasbih, T.timetable] },
  { title: 'Track and reflect', tools: [T.journal, T.tracker] },
  { title: 'Learn', tools: [T.names, T.calendar, T.shahadah, T.greetings] },
  { title: 'More', tools: [T.zakat, T.settings] },
];
