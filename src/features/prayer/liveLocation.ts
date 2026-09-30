import { Platform } from 'react-native';
import { useSettings } from '@/features/settings/store';
import { currentDeviceLocation } from './deviceLocation';

// Re-reading the position more often than this adds nothing: prayer times move by a minute only
// after tens of kilometres.
const MIN_INTERVAL_MS = 5 * 60_000;
let lastRun = 0;
let running = false;

/**
 * Keep a phone-located prayer location current, so times (and Ramadan's sehri and iftar) follow the
 * user when they travel. Runs on launch and whenever the app comes back to the foreground. A city
 * the user picked by hand is left alone; the default (Dhaka, before any choice) is replaced as soon as
 * location permission exists.
 */
export async function refreshLiveLocation(fallbackName: string, force = false): Promise<void> {
  if (Platform.OS === 'web' || running) return;
  const { location, setLocation } = useSettings.getState();
  if (location.source === 'city') return;
  if (!force && Date.now() - lastRun < MIN_INTERVAL_MS) return;
  running = true;
  lastRun = Date.now();
  try {
    const next = await currentDeviceLocation(location, fallbackName);
    // Only adopt the local calculation method when the country changes (or on the first real fix).
    if (next && useSettings.getState().location.source !== 'city') setLocation(next, next.cc !== location.cc || location.source === 'default');
  } catch {
    // No fix right now; keep the last known location.
  } finally {
    running = false;
  }
}
