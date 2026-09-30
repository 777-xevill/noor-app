import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';
import { deviceLang } from '@/i18n/device';
import type { Lang } from '@/i18n/langs';
import {
  type AsrMadhab,
  type CalcMethod,
  DEFAULT_LOCATION,
  type PrayerLocation,
  suggestedMadhab,
  suggestedMethod,
} from '@/features/prayer/location';

export type ThemeMode = 'system' | 'light' | 'dark';
export type HighLatitude = 'auto' | 'middleOfTheNight' | 'seventhOfTheNight' | 'twilightAngle';
export type AlertKind = 'off' | 'silent' | 'sound' | 'adhan';
export type AdjustableTime = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type AlertPrayer = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type PrayerPrefs = {
  method: CalcMethod;
  madhab: AsrMadhab;
  highLatitude: HighLatitude;
  /** Minutes added to each computed time, to match a local mosque. */
  adjustments: Record<AdjustableTime, number>;
};

export type QuranPrefs = { showTranslit: boolean; showEnglish: boolean; showBangla: boolean; arabicSize: number };

export type DarkStyle = 'graphite' | 'midnight';
export type ReaderView = 'normal' | 'tajweed' | 'words';

export type SettingsState = PrayerPrefs & {
  themeMode: ThemeMode;
  /** Midnight (true black) is a Noor Plus perk; Graphite otherwise. */
  darkStyle: DarkStyle;
  language: Lang;
  displayName: string;
  onboarded: boolean;
  location: PrayerLocation;
  /** Days added to the Umm al-Qura date to follow local moon sighting. */
  hijriOffset: number;
  alerts: Record<AlertPrayer, AlertKind>;
  /** Extra reminder this many minutes before each alerted prayer (0 = none). */
  reminderBefore: number;
  quran: QuranPrefs;
  /** everyayah.com folder of the chosen reciter */
  reciter: string;
  readerView: ReaderView;

  set: (patch: Partial<Omit<SettingsState, 'set' | 'setLocation' | 'setThemeMode' | 'setDisplayName'>>) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setDisplayName: (name: string) => void;
  /** Change location; optionally adopt the method and madhab usual for its country. */
  setLocation: (location: PrayerLocation, adoptLocalMethod?: boolean) => void;
};

const NO_ADJUSTMENTS: Record<AdjustableTime, number> = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

const DEFAULTS = {
  // Light "Mist" is the signature look; dark stays one tap away.
  themeMode: 'light' as ThemeMode,
  darkStyle: 'graphite' as DarkStyle,
  language: deviceLang(),
  displayName: '',
  onboarded: false,
  location: DEFAULT_LOCATION,
  method: suggestedMethod(DEFAULT_LOCATION.cc),
  madhab: suggestedMadhab(DEFAULT_LOCATION.cc),
  highLatitude: 'auto' as HighLatitude,
  adjustments: NO_ADJUSTMENTS,
  hijriOffset: 0,
  alerts: { fajr: 'sound', dhuhr: 'sound', asr: 'sound', maghrib: 'sound', isha: 'sound' } as Record<AlertPrayer, AlertKind>,
  reminderBefore: 0,
  quran: { showTranslit: false, showEnglish: true, showBangla: true, arabicSize: 30 } as QuranPrefs,
  reciter: 'Alafasy_128kbps',
  readerView: 'normal' as ReaderView,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (patch) => set(patch),
      setThemeMode: (themeMode) => set({ themeMode }),
      setDisplayName: (displayName) => set({ displayName }),
      setLocation: (location, adoptLocalMethod = false) =>
        set(adoptLocalMethod ? { location, method: suggestedMethod(location.cc), madhab: suggestedMadhab(location.cc) } : { location }),
    }),
    {
      name: 'noor.settings',
      storage: persistStorage,
      version: 2,
      // v1 stored method/madhab inside the location and a fixed UTC offset. Keep only what still applies.
      migrate: (persisted, version) => {
        const old = (persisted ?? {}) as Partial<SettingsState>;
        if (version < 2) return { ...DEFAULTS, themeMode: old.themeMode ?? DEFAULTS.themeMode, displayName: old.displayName ?? '' };
        return { ...DEFAULTS, ...old };
      },
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<SettingsState>) }),
    },
  ),
);

export const selectPrayerPrefs = (s: SettingsState): PrayerPrefs => ({
  method: s.method,
  madhab: s.madhab,
  highLatitude: s.highLatitude,
  adjustments: s.adjustments,
});
