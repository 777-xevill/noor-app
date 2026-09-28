import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';
import { DEFAULT_LOCATION, type PrayerLocation } from '@/features/prayer/location';

export type ThemeMode = 'system' | 'light' | 'dark';

type SettingsState = {
  themeMode: ThemeMode;
  displayName: string;
  location: PrayerLocation;
  setThemeMode: (mode: ThemeMode) => void;
  setDisplayName: (name: string) => void;
  setLocation: (location: PrayerLocation) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      // Light "Mist" is the signature look; dark stays one tap away.
      themeMode: 'light',
      displayName: '',
      location: DEFAULT_LOCATION,
      setThemeMode: (themeMode) => set({ themeMode }),
      setDisplayName: (displayName) => set({ displayName }),
      setLocation: (location) => set({ location }),
    }),
    { name: 'noor.settings', storage: persistStorage, version: 1 },
  ),
);
