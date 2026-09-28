export type CalcMethod = 'Karachi' | 'MuslimWorldLeague' | 'UmmAlQura' | 'Egyptian' | 'NorthAmerica' | 'Dubai';
export type AsrMadhab = 'Hanafi' | 'Shafi';

export type PrayerLocation = {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  /** Wall-clock offset from UTC for this place, in minutes. Times are shown in the place's time, not the device's. */
  utcOffsetMinutes: number;
  method: CalcMethod;
  madhab: AsrMadhab;
};

// Until the user shares a location (onboarding task), default to Dhaka with the
// method Bangladesh uses: University of Islamic Sciences, Karachi + Hanafi Asr.
export const DEFAULT_LOCATION: PrayerLocation = {
  city: 'Dhaka',
  country: 'Bangladesh',
  latitude: 23.8103,
  longitude: 90.4125,
  utcOffsetMinutes: 360,
  method: 'Karachi',
  madhab: 'Hanafi',
};

export const METHOD_LABEL: Record<CalcMethod, string> = {
  Karachi: 'Karachi',
  MuslimWorldLeague: 'Muslim World League',
  UmmAlQura: 'Umm al-Qura',
  Egyptian: 'Egyptian',
  NorthAmerica: 'ISNA',
  Dubai: 'Dubai',
};
