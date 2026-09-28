import { Platform } from 'react-native';
import { Asset } from 'expo-asset';

const cache = new Map<number, Promise<unknown>>();

async function read(mod: number): Promise<unknown> {
  const asset = Asset.fromModule(mod);
  if (Platform.OS === 'web') {
    const res = await fetch(asset.uri);
    if (!res.ok) throw new Error(`Could not load ${asset.name} (${res.status})`);
    return res.json();
  }
  await asset.downloadAsync();
  // Loaded lazily so the web build never touches the native file system module.
  const { File } = require('expo-file-system') as typeof import('expo-file-system');
  return JSON.parse(await new File(asset.localUri ?? asset.uri).text());
}

/** Load a bundled JSON data asset (e.g. one surah) once, then serve it from memory. */
export function loadDataAsset<T>(mod: number): Promise<T> {
  let pending = cache.get(mod);
  if (!pending) {
    pending = read(mod);
    pending.catch(() => cache.delete(mod)); // allow a retry after a failure
    cache.set(mod, pending);
  }
  return pending as Promise<T>;
}
