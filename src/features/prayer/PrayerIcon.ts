import type { IconName } from '@/components/Icon';
import type { PrayerKey } from './times';

export const PRAYER_ICON: Record<PrayerKey | 'sunrise', IconName> = {
  fajr: 'sunrise',
  sunrise: 'sun',
  dhuhr: 'sun',
  asr: 'cloudSun',
  maghrib: 'sunset',
  isha: 'moonStar',
};
