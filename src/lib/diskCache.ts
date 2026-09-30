import { Platform } from 'react-native';

// A small best-effort JSON cache on the phone's storage, so text fetched once (hadith sections, tafsir)
// opens again offline. On the web build it does nothing and callers fall back to their in-memory copy.
type Fs = typeof import('expo-file-system');
const fs = (): Fs | null => (Platform.OS === 'web' ? null : (require('expo-file-system') as Fs));

const safe = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

export async function readCache<T>(name: string): Promise<T | null> {
  try {
    const F = fs();
    if (!F) return null;
    const file = new F.File(F.Paths.document, 'noor-cache', `${safe(name)}.json`);
    if (!file.exists) return null;
    return JSON.parse(await file.text()) as T;
  } catch {
    return null;
  }
}

export async function writeCache(name: string, value: unknown): Promise<void> {
  try {
    const F = fs();
    if (!F) return;
    const dir = new F.Directory(F.Paths.document, 'noor-cache');
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const file = new F.File(dir, `${safe(name)}.json`);
    if (!file.exists) file.create();
    file.write(JSON.stringify(value));
  } catch {
    // Caching is a convenience; never fail the screen over it.
  }
}
