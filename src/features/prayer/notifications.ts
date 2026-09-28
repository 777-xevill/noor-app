import { Platform } from 'react-native';
import { addDays, formatClockFull, wallDay } from '@/lib/dates';
import { useSettings } from '@/features/settings/store';
import { prayerLabel, PRAYERS, prayerTimesFor } from './times';

// Prayer alerts are scheduled as local notifications for the coming days and re-planned whenever
// settings change or the app returns to the foreground. iOS keeps at most 64 pending notifications.
const DAYS_AHEAD = 7;
const MAX_PENDING = 60;

type NotificationsModule = typeof import('expo-notifications');
const load = (): NotificationsModule | null =>
  Platform.OS === 'web' ? null : (require('expo-notifications') as NotificationsModule);

let configured = false;

async function configure(N: NotificationsModule) {
  if (configured) return;
  configured = true;
  N.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
  });
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('prayer-sound', { name: 'Prayer times (sound)', importance: N.AndroidImportance.HIGH, sound: 'default' });
    await N.setNotificationChannelAsync('prayer-silent', { name: 'Prayer times (silent)', importance: N.AndroidImportance.DEFAULT, sound: null });
  }
}

export const alertsSupported = Platform.OS !== 'web';

export async function requestAlertPermission(): Promise<boolean> {
  const N = load();
  if (!N) return false;
  await configure(N);
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await N.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return asked.granted;
}

export async function reschedulePrayerAlerts() {
  const N = load();
  if (!N) return;
  await configure(N);
  if (!(await N.getPermissionsAsync()).granted) return;

  const s = useSettings.getState();
  const { location: loc, alerts, reminderBefore, hijriOffset } = s;
  const prefs = { method: s.method, madhab: s.madhab, highLatitude: s.highLatitude, adjustments: s.adjustments };

  await N.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  const today = wallDay(new Date(), loc.timeZone);
  let pending = 0;

  for (let d = 0; d < DAYS_AHEAD && pending < MAX_PENDING; d++) {
    const day = addDays(today, d);
    const times = prayerTimesFor(loc, day, prefs, hijriOffset);
    for (const { key } of PRAYERS) {
      const kind = alerts[key];
      if (kind === 'off') continue;
      const at = times[key];
      const label = prayerLabel(key, day);
      const channelId = kind === 'sound' ? 'prayer-sound' : 'prayer-silent';

      if (reminderBefore > 0) {
        const early = new Date(at.getTime() - reminderBefore * 60_000);
        if (early.getTime() > now && pending < MAX_PENDING) {
          await N.scheduleNotificationAsync({
            content: { title: `${label} in ${reminderBefore} minutes`, body: `${label} begins at ${formatClockFull(at, loc.timeZone)} in ${loc.city}.`, sound: kind === 'sound' },
            trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: early, channelId },
          });
          pending++;
        }
      }
      if (at.getTime() > now && pending < MAX_PENDING) {
        await N.scheduleNotificationAsync({
          content: { title: `${label} · ${formatClockFull(at, loc.timeZone)}`, body: `It’s time for ${label} in ${loc.city}.`, sound: kind === 'sound' },
          trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: at, channelId },
        });
        pending++;
      }
    }
  }
}
