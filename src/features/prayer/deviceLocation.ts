import * as Location from 'expo-location';
import { CITIES } from '@/data/cities';
import { distanceKm } from '@/lib/geo';
import { deviceTimeZone } from '@/lib/tz';
import type { PrayerLocation } from './location';


function nearestCity(lat: number, lng: number) {
  let best = CITIES[0];
  let bestKm = Infinity;
  for (const c of CITIES) {
    const km = distanceKm(lat, lng, c.lat, c.lng);
    if (km < bestKm) {
      best = c;
      bestKm = km;
    }
  }
  return { city: best, km: bestKm };
}

/** `code` lets each screen explain the problem in the user's language. */
/** Moving less than this doesn't change prayer times by even a minute. */
const MOVE_KM = 3;

export class LocationError extends Error {
  constructor(public code: 'denied' | 'unavailable') {
    super(code);
  }
}

/** Name a position (city, country) and describe it as a prayer location. */
async function describe(latitude: number, longitude: number, fallbackName: string): Promise<PrayerLocation> {
  let city = '';
  let country = '';
  let cc = '';
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    city = place?.city ?? place?.subregion ?? place?.region ?? '';
    country = place?.country ?? '';
    cc = place?.isoCountryCode ?? '';
  } catch {
    // Reverse geocoding isn't available everywhere (e.g. some browsers); name it after the nearest known city.
  }
  if (!city || !cc) {
    const near = nearestCity(latitude, longitude);
    if (near.km < 150) {
      city = city || near.city.name;
      country = country || near.city.country;
      cc = cc || near.city.cc;
    }
  }

  return {
    city: city || fallbackName,
    country,
    cc,
    latitude: Math.round(latitude * 10_000) / 10_000,
    longitude: Math.round(longitude * 10_000) / 10_000,
    timeZone: deviceTimeZone(),
    source: 'gps',
  };
}

async function readPosition(maxAgeMs: number): Promise<Location.LocationObject> {
  try {
    const last = await Location.getLastKnownPositionAsync({ maxAge: maxAgeMs });
    if (last) return last;
    // A fresh fix can take a while indoors; don't wait forever.
    return await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 20_000)),
    ]);
  } catch {
    throw new LocationError('unavailable');
  }
}

/** Ask for permission, read the device position and describe it as a prayer location. */
export async function locateDevice(fallbackName = 'Current location'): Promise<PrayerLocation> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) throw new LocationError('denied');
  const pos = await readPosition(30 * 60_000);
  return describe(pos.coords.latitude, pos.coords.longitude, fallbackName);
}

/**
 * Where the phone is now, without asking for permission (null when permission hasn't been given or
 * no fix is available). Only names the place when it moved from `from` or the time zone changed.
 */
export async function currentDeviceLocation(from: PrayerLocation, fallbackName: string): Promise<PrayerLocation | null> {
  const perm = await Location.getForegroundPermissionsAsync();
  if (!perm.granted) return null;
  const pos = await readPosition(10 * 60_000).catch(() => null);
  if (!pos) return null;
  const { latitude, longitude } = pos.coords;
  const moved = distanceKm(latitude, longitude, from.latitude, from.longitude) >= MOVE_KM;
  if (!moved && from.timeZone === deviceTimeZone() && from.source === 'gps') return null;
  return describe(latitude, longitude, fallbackName);
}
