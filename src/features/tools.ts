import type { IconName } from '@/components/Icon';

export type Tool = { key: string; label: string; icon: IconName; href?: '/quran' | '/prayers' };

/** The everyday tools, in the order they appear on Home. */
export const CORE_TOOLS: Tool[] = [
  { key: 'qibla', label: 'Qibla', icon: 'compass' },
  { key: 'quran', label: 'Quran', icon: 'book', href: '/quran' },
  { key: 'duas', label: 'Duas', icon: 'dua' },
  { key: 'tasbih', label: 'Tasbih', icon: 'tasbih' },
  { key: 'journal', label: 'Journal', icon: 'journal' },
  { key: 'calendar', label: 'Calendar', icon: 'calendar' },
  { key: 'zakat', label: 'Zakat', icon: 'calculator' },
  { key: 'names', label: '99 Names', icon: 'names' },
];
