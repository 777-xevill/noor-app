import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

type SyncMeta = {
  /** The account this phone last synced with. A different account means a first sync here. */
  userId: string | null;
  email: string | null;
  /** The cloud copy's `updated_at` as of the last sync, to tell whether another phone wrote since. */
  remoteAt: string | null;
  /** Something changed on this phone since the last sync. */
  dirty: boolean;
  /** When synced settings last changed on this phone. */
  settingsAt: number;
  lastSync: number | null;
  set: (patch: Partial<Omit<SyncMeta, 'set'>>) => void;
};

export const useSyncMeta = create<SyncMeta>()(
  persist(
    (set) => ({
      userId: null,
      email: null,
      remoteAt: null,
      dirty: false,
      settingsAt: 0,
      lastSync: null,
      set: (patch) => set(patch),
    }),
    { name: 'noor.sync', storage: persistStorage, version: 1 },
  ),
);
