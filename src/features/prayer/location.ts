export type CalcMethod =
  | 'Karachi'
  | 'MuslimWorldLeague'
  | 'UmmAlQura'
  | 'Egyptian'
  | 'NorthAmerica'
  | 'MoonsightingCommittee'
  | 'Dubai'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'Turkey'
  | 'Tehran';

export type AsrMadhab = 'Hanafi' | 'Shafi';

export type PrayerLocation = {
  city: string;
  country: string;
  /** ISO 3166-1 alpha-2 country code, used to suggest a calculation method. */
  cc: string;
  latitude: number;
  longitude: number;
  /** IANA time zone; prayer times are shown in this zone's local time. */
  timeZone: string;
  source: 'default' | 'gps' | 'city';
};

// Until the user sets a location, default to Dhaka.
export const DEFAULT_LOCATION: PrayerLocation = {
  city: 'Dhaka',
  country: 'Bangladesh',
  cc: 'BD',
  latitude: 23.8103,
  longitude: 90.4125,
  timeZone: 'Asia/Dhaka',
  source: 'default',
};

export const METHODS: { key: CalcMethod; label: string; detail: string }[] = [
  { key: 'Karachi', label: 'Karachi', detail: 'University of Islamic Sciences · Fajr 18° · Isha 18°' },
  { key: 'MuslimWorldLeague', label: 'Muslim World League', detail: 'Fajr 18° · Isha 17°' },
  { key: 'UmmAlQura', label: 'Umm al-Qura, Makkah', detail: 'Fajr 18.5° · Isha 90 min after Maghrib (120 in Ramadan)' },
  { key: 'Egyptian', label: 'Egyptian General Authority', detail: 'Fajr 19.5° · Isha 17.5°' },
  { key: 'NorthAmerica', label: 'ISNA (North America)', detail: 'Fajr 15° · Isha 15°' },
  { key: 'MoonsightingCommittee', label: 'Moonsighting Committee', detail: 'Fajr 18° · Isha 18° · seasonal adjustment' },
  { key: 'Dubai', label: 'Dubai', detail: 'Fajr 18.2° · Isha 18.2°' },
  { key: 'Kuwait', label: 'Kuwait', detail: 'Fajr 18° · Isha 17.5°' },
  { key: 'Qatar', label: 'Qatar', detail: 'Fajr 18° · Isha 90 min after Maghrib' },
  { key: 'Singapore', label: 'Singapore / Malaysia / Indonesia', detail: 'Fajr 20° · Isha 18°' },
  { key: 'Turkey', label: 'Diyanet (Türkiye)', detail: 'Fajr 18° · Isha 17°' },
  { key: 'Tehran', label: 'Institute of Geophysics, Tehran', detail: 'Fajr 17.7° · Isha 14° · Maghrib 4.5°' },
];

export const METHOD_LABEL = Object.fromEntries(METHODS.map((m) => [m.key, m.label])) as Record<CalcMethod, string>;

const METHOD_BY_COUNTRY: Record<string, CalcMethod> = {
  BD: 'Karachi',
  PK: 'Karachi',
  IN: 'Karachi',
  AF: 'Karachi',
  NP: 'Karachi',
  SA: 'UmmAlQura',
  BH: 'UmmAlQura',
  OM: 'UmmAlQura',
  YE: 'UmmAlQura',
  AE: 'Dubai',
  KW: 'Kuwait',
  QA: 'Qatar',
  EG: 'Egyptian',
  SD: 'Egyptian',
  LY: 'Egyptian',
  TR: 'Turkey',
  IR: 'Tehran',
  MY: 'Singapore',
  SG: 'Singapore',
  ID: 'Singapore',
  BN: 'Singapore',
  US: 'NorthAmerica',
  CA: 'NorthAmerica',
  GB: 'MoonsightingCommittee',
};

// Countries where the Hanafi school is predominant (later Asr).
const HANAFI_COUNTRIES = new Set(['BD', 'PK', 'IN', 'AF', 'NP', 'TR', 'UZ', 'TJ', 'KZ', 'KG', 'TM', 'AZ']);

export function suggestedMethod(cc: string): CalcMethod {
  return METHOD_BY_COUNTRY[cc.toUpperCase()] ?? 'MuslimWorldLeague';
}

export function suggestedMadhab(cc: string): AsrMadhab {
  return HANAFI_COUNTRIES.has(cc.toUpperCase()) ? 'Hanafi' : 'Shafi';
}
