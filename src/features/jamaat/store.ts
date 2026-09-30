import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';
import { type JamaatTimes, sanitizeTimes } from './rules';

/** The mosque a person follows (chosen from the nearby list), with its jamaat times. */
export type FollowedMosque = {
  /** OpenStreetMap id, e.g. "node/123" */
  id: string;
  name: string;
  lat: number;
  lng: number;
  times: JamaatTimes;
  /** where the times came from: typed here, or shared by another person */
  source: 'me' | 'shared';
  updatedAt: number;
};

type JamaatState = {
  mosque: FollowedMosque | null;
  /** Alert this many minutes before jamaat; 0 = no jamaat alerts. */
  alertBefore: number;
  follow: (m: Omit<FollowedMosque, 'times' | 'source' | 'updatedAt'> & Partial<Pick<FollowedMosque, 'times' | 'source'>>) => void;
  unfollow: () => void;
  setTimes: (times: JamaatTimes, source: 'me' | 'shared') => void;
  setAlertBefore: (minutes: number) => void;
};

export const useJamaat = create<JamaatState>()(
  persist(
    (set) => ({
      mosque: null,
      alertBefore: 0,
      follow: (m) => set({ mosque: { ...m, times: sanitizeTimes(m.times), source: m.source ?? 'me', updatedAt: Date.now() } }),
      unfollow: () => set({ mosque: null }),
      setTimes: (times, source) => set((s) => (s.mosque ? { mosque: { ...s.mosque, times: sanitizeTimes(times), source, updatedAt: Date.now() } } : s)),
      setAlertBefore: (alertBefore) => set({ alertBefore }),
    }),
    { name: 'noor.jamaat', storage: persistStorage, version: 1 },
  ),
);
