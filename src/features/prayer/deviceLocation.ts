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

export class LocationError extends Error {}

/** Ask for permission, read the device position and describe it as a prayer location. */
export async function locateDevice(): Promise<PrayerLocation> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) throw new LocationError('Location access wasn’t allowed. You can choose your city from the list instead.');

  let pos: Location.LocationObject | null = null;
  try {
    pos = (await Location.getLastKnownPositionAsync({ maxAge: 30 * 60_000 })) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  } catch {
    throw new LocationError('Your position couldn’t be found. Make sure location is turned on, or choose your city from the list.');
  }
  const { latitude, longitude } = pos.coords;

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
    city: city || 'Current location',
    country,
    cc,
    latitude: Math.round(latitude * 10_000) / 10_000,
    longitude: Math.round(longitude * 10_000) / 10_000,
    timeZone: deviceTimeZone(),
    source: 'gps',
  };
}
