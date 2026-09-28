import { addDays, dayKey, wallDay } from '@/lib/dates';
import { usePrayerLog } from '@/features/prayer/log';
import { PRAYERS, scheduleAt, type PrayerKey } from '@/features/prayer/times';
import { useQuranProgress } from '@/features/quran/progress';
import { useSettings } from '@/features/settings/store';

/**
 * Preview builds only (EXPO_PUBLIC_DEMO_DATA=1): fill an empty install with a plausible week
 * so the design can be reviewed with content. Never runs in a real build.
 */
export const DEMO_ENABLED = process.env.EXPO_PUBLIC_DEMO_DATA === '1';

// How many of the five prayers were kept on each of the previous six days.
const PAST_WEEK_PATTERN = [5, 4, 5, 3, 5, 5];

export function seedDemoData() {
  if (!DEMO_ENABLED) return;

  const settings = useSettings.getState();
  if (!settings.displayName) settings.setDisplayName('Ashik');
  // The preview opens straight to Home; the welcome flow stays available from Settings.
  if (!settings.onboarded) settings.set({ onboarded: true });

  const log = usePrayerLog.getState();
  if (Object.keys(log.days).length === 0) {
    const loc = settings.location;
    const now = new Date();
    const today = wallDay(now, loc.timeZone);
    const days: Record<string, PrayerKey[]> = {};

    PAST_WEEK_PATTERN.forEach((count, i) => {
      const day = addDays(today, -(PAST_WEEK_PATTERN.length - i));
      days[dayKey(day)] = PRAYERS.slice(0, count).map((p) => p.key);
    });

    // Today: everything before the prayer currently running has been prayed.
    const { current } = scheduleAt(now, loc, settings, settings.hijriOffset);
    const upTo = current ? PRAYERS.findIndex((p) => p.key === current) : -1;
    days[dayKey(today)] = PRAYERS.slice(0, Math.max(0, upTo)).map((p) => p.key);

    log.replaceAll(days);
  }

  const quran = useQuranProgress.getState();
  if (!quran.lastRead) {
    quran.setLastRead({ surahNumber: 18, surah: 'Al-Kahf', surahMeaning: 'The Cave', ayah: 46, totalAyahs: 110 });
  }
}
