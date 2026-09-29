import AsyncStorage from '@react-native-async-storage/async-storage';
import { bearingDeg, distanceKm } from '@/lib/geo';

// Mosques and halal food from OpenStreetMap, through the public Overpass API. Answers are cached
// for a day per area, and three mirrors are tried in turn. Data © OpenStreetMap contributors (ODbL).

export type PlaceKind = 'mosque' | 'halal';

export type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export type Place = {
  id: string;
  kind: PlaceKind;
  lat: number;
  lng: number;
  /** Local name, English name and Bangla name as mapped; any may be missing. */
  name?: string;
  nameEn?: string;
  nameBn?: string;
  /** e.g. "restaurant", "fast_food" for halal places. */
  amenity?: string;
  km: number;
  bearing: number;
};

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const QUERIES: Record<PlaceKind, (r: number, lat: number, lng: number) => string> = {
  mosque: (r, lat, lng) => `nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${r},${lat},${lng});`,
  halal: (r, lat, lng) => `nwr["diet:halal"~"^(yes|only)$"](around:${r},${lat},${lng});nwr["cuisine"~"halal"](around:${r},${lat},${lng});`,
};

const DAY = 24 * 3_600_000;

/** Turn raw OSM elements into places, measured from (lat, lng), nearest first. */
export function toPlaces(kind: PlaceKind, elements: OverpassElement[], lat: number, lng: number): Place[] {
  const seen = new Set<string>();
  const places: Place[] = [];
  for (const e of elements) {
    const p = e.center ?? (e.lat !== undefined && e.lon !== undefined ? { lat: e.lat, lon: e.lon } : null);
    if (!p) continue;
    const id = `${e.type}/${e.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const t = e.tags ?? {};
    places.push({
      id,
      kind,
      lat: p.lat,
      lng: p.lon,
      name: t.name,
      nameEn: t['name:en'],
      nameBn: t['name:bn'],
      amenity: t.amenity,
      km: distanceKm(lat, lng, p.lat, p.lon),
      bearing: bearingDeg(lat, lng, p.lat, p.lon),
    });
  }
  return places.sort((a, b) => a.km - b.km);
}

async function query(body: string): Promise<OverpassElement[]> {
  const data = `[out:json][timeout:25];(${body});out center tags 120;`;
  let lastError: unknown;
  for (const url of MIRRORS) {
    // A busy mirror can hang for a minute; give each one 12 seconds, then try the next.
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 12_000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        signal: abort.signal,
        // Overpass turns away generic library user agents (Android's okhttp gets HTTP 406), so say who we are.
        // Browsers ignore this header and send their own, which is accepted.
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Noor/1.0 (Islamic prayer times app)' },
        body: `data=${encodeURIComponent(data)}`,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return ((await res.json()) as { elements: OverpassElement[] }).elements;
    } catch (e) {
      lastError = e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? new Error('Overpass unavailable');
}

/**
 * Places of `kind` within `radiusM` of (lat, lng). Cached for a day per ~1 km area, so opening the
 * screen again doesn't ask the volunteer-run servers twice.
 */
export async function findPlaces(kind: PlaceKind, lat: number, lng: number, radiusM: number): Promise<Place[]> {
  const key = `noor.places.${kind}.${lat.toFixed(2)},${lng.toFixed(2)}.${radiusM}`;
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const { at, elements } = JSON.parse(cached) as { at: number; elements: OverpassElement[] };
      if (Date.now() - at < DAY) return toPlaces(kind, elements, lat, lng);
    }
  } catch {}
  const elements = await query(QUERIES[kind](radiusM, lat, lng));
  AsyncStorage.setItem(key, JSON.stringify({ at: Date.now(), elements })).catch(() => {});
  return toPlaces(kind, elements, lat, lng);
}
