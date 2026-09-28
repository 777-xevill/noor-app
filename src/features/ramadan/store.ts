import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

type RamadanState = {
  /** "1448-12" → juz 12 of the 30-day plan read in Ramadan 1448 */
  juzRead: Record<string, boolean>;
  /** dayKey → Taraweeh prayed that night */
  taraweeh: Record<string, boolean>;
  /** Minutes before Fajr to stop eating (0 = at Fajr). */
  sehriMargin: number;
  /** Minutes before Sehri ends to remind (0 = off). */
  sehriReminder: number;
  iftarAlert: boolean;
  toggleJuz: (key: string) => void;
  toggleTaraweeh: (dayKey: string) => void;
  set: (patch: Partial<Pick<RamadanState, 'sehriMargin' | 'sehriReminder' | 'iftarAlert'>>) => void;
};

export const useRamadan = create<RamadanState>()(
  persist(
    (set) => ({
      juzRead: {},
      taraweeh: {},
      sehriMargin: 0,
      sehriReminder: 30,
      iftarAlert: true,
      toggleJuz: (key) => set((s) => ({ juzRead: { ...s.juzRead, [key]: !s.juzRead[key] } })),
      toggleTaraweeh: (dayKey) => set((s) => ({ taraweeh: { ...s.taraweeh, [dayKey]: !s.taraweeh[dayKey] } })),
      set: (patch) => set(patch),
    }),
    { name: 'noor.ramadan', storage: persistStorage, version: 1 },
  ),
);
