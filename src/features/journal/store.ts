import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

export const MOODS = [
  { key: 'grateful', label: 'Grateful' },
  { key: 'peaceful', label: 'At peace' },
  { key: 'hopeful', label: 'Hopeful' },
  { key: 'patient', label: 'Patient' },
  { key: 'repentant', label: 'Repentant' },
  { key: 'anxious', label: 'Anxious' },
  { key: 'sad', label: 'Low' },
] as const;

export const EXTRAS = [
  { key: 'morningAdhkar', label: 'Morning adhkar' },
  { key: 'eveningAdhkar', label: 'Evening adhkar' },
  { key: 'duha', label: 'Duha prayer' },
  { key: 'witr', label: 'Witr' },
  { key: 'tahajjud', label: 'Tahajjud' },
] as const;

export const DEEDS = [
  { key: 'charity', label: 'Gave charity' },
  { key: 'helped', label: 'Helped someone' },
  { key: 'family', label: 'Kept in touch with family' },
  { key: 'kindWord', label: 'Said a kind word' },
  { key: 'smiled', label: 'Smiled at someone' },
  { key: 'learned', label: 'Learned something beneficial' },
  { key: 'forgave', label: 'Forgave someone' },
  { key: 'removedHarm', label: 'Removed something harmful from a path' },
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
