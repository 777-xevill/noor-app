import type { FastState } from '@/features/fasting/store';
import type { JournalEntry } from '@/features/journal/store';
import type { PrayerKey } from '@/features/prayer/times';
import type { LastRead } from '@/features/quran/progress';
import type { SettingsState } from '@/features/settings/store';

// What an account keeps in the cloud, and how two copies are combined. Pure, so the verify script
// can test it. Zakat figures are deliberately left out: they stay on the phone.

export const SYNCED_SETTINGS = [
  'displayName',
  'language',
  'location',
  'method',
  'madhab',
  'highLatitude',
  'adjustments',
  'hijriOffset',
  'alerts',
  'reminderBefore',
  'quran',
] as const satisfies readonly (keyof SettingsState)[];

export type SyncedSettings = Pick<SettingsState, (typeof SYNCED_SETTINGS)[number]>;

export type SyncData = {
  v: 1;
  /** `at`: when the settings were last changed, so the newer copy wins. */
  settings: { at: number; value: SyncedSettings };
  prayers: Record<string, PrayerKey[]>;
  reading: Record<string, number>;
  lastRead: LastRead | null;
  bookmarks: string[];
  goalMinutes: number;
  journal: Record<string, JournalEntry>;
  fasts: Record<string, FastState>;
  dhikr: Record<string, number>;
  savedDuas: string[];
  juzRead: Record<string, boolean>;
  taraweeh: Record<string, boolean>;
  earned: Record<string, string>;
};

const union = <T,>(a: T[], b: T[]) => [...new Set([...a, ...b])];

function byKey<V>(a: Record<string, V>, b: Record<string, V>, pick: (x: V, y: V) => V): Record<string, V> {
  const out: Record<string, V> = { ...b };
  for (const [k, v] of Object.entries(a)) out[k] = k in b ? pick(v, b[k]) : v;
  return out;
}

/**
 * Combine this phone's data (`local`) with the account's (`remote`) when both changed since they
 * last met. Nothing logged on either side is lost: logged days are united, counters keep the
 * higher value, a journal day keeps its newest edit, settings follow whichever changed last.
 */
export function mergeSyncData(local: SyncData, remote: SyncData): SyncData {
  return {
    v: 1,
    settings: remote.settings.at > local.settings.at ? remote.settings : local.settings,
    prayers: byKey(local.prayers, remote.prayers, union),
    reading: byKey(local.reading, remote.reading, Math.max),
    lastRead: local.lastRead ?? remote.lastRead,
    bookmarks: union(local.bookmarks, remote.bookmarks),
    goalMinutes: local.goalMinutes,
    journal: byKey(local.journal, remote.journal, (x, y) => (y.updatedAt > x.updatedAt ? y : x)),
    fasts: byKey(local.fasts, remote.fasts, (x) => x),
    dhikr: byKey(local.dhikr, remote.dhikr, Math.max),
    savedDuas: union(local.savedDuas, remote.savedDuas),
    juzRead: byKey(local.juzRead, remote.juzRead, (x, y) => x || y),
    taraweeh: byKey(local.taraweeh, remote.taraweeh, (x, y) => x || y),
    earned: byKey(local.earned, remote.earned, (x, y) => (y < x ? y : x)),
  };
}
