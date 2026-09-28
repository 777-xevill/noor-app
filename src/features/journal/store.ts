import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

// `label` values are translation keys.

export const MOODS = [
  { key: 'grateful', label: 'mood.grateful' },
  { key: 'peaceful', label: 'mood.peaceful' },
  { key: 'hopeful', label: 'mood.hopeful' },
  { key: 'patient', label: 'mood.patient' },
  { key: 'repentant', label: 'mood.repentant' },
  { key: 'anxious', label: 'mood.anxious' },
  { key: 'sad', label: 'mood.sad' },
] as const;

export const EXTRAS = [
  { key: 'morningAdhkar', label: 'extra.morningAdhkar' },
  { key: 'eveningAdhkar', label: 'extra.eveningAdhkar' },
  { key: 'duha', label: 'extra.duha' },
  { key: 'witr', label: 'extra.witr' },
  { key: 'tahajjud', label: 'extra.tahajjud' },
] as const;

export const DEEDS = [
  { key: 'charity', label: 'deed.charity' },
  { key: 'helped', label: 'deed.helped' },
  { key: 'family', label: 'deed.family' },
  { key: 'kindWord', label: 'deed.kindWord' },
  { key: 'smiled', label: 'deed.smiled' },
  { key: 'learned', label: 'deed.learned' },
  { key: 'forgave', label: 'deed.forgave' },
  { key: 'removedHarm', label: 'deed.removedHarm' },
] as const;

export type MoodKey = (typeof MOODS)[number]['key'];
export type ExtraKey = (typeof EXTRAS)[number]['key'];
export type DeedKey = (typeof DEEDS)[number]['key'];

export type JournalEntry = {
  reflection: string;
  moods: MoodKey[];
  extras: ExtraKey[];
  deeds: DeedKey[];
  updatedAt: number;
};

export const EMPTY_ENTRY: JournalEntry = { reflection: '', moods: [], extras: [], deeds: [], updatedAt: 0 };

export const hasContent = (e?: JournalEntry) => !!e && (e.reflection.trim().length > 0 || e.moods.length + e.extras.length + e.deeds.length > 0);

type JournalState = {
  entries: Record<string, JournalEntry>;
  update: (dayKey: string, patch: Partial<JournalEntry>) => void;
};

export const useJournal = create<JournalState>()(
  persist(
    (set) => ({
      entries: {},
      update: (dayKey, patch) =>
        set((s) => ({ entries: { ...s.entries, [dayKey]: { ...(s.entries[dayKey] ?? EMPTY_ENTRY), ...patch, updatedAt: Date.now() } } })),
    }),
    { name: 'noor.journal', storage: persistStorage, version: 1 },
  ),
);

export function toggleIn<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}
