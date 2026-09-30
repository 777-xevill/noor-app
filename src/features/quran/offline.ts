import { Platform } from 'react-native';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';
import { ayahAudioUrl, ayahFile } from './reciters';

// Recitation kept on the phone, one folder per reciter and surah, so it plays without a connection.
type Fs = typeof import('expo-file-system');
const fs = (): Fs | null => (Platform.OS === 'web' ? null : (require('expo-file-system') as Fs));

export const offlineSupported = Platform.OS !== 'web';

const folder = (F: Fs, reciter: string, surah: number) => new F.Directory(F.Paths.document, 'audio', reciter, String(surah));

/** The saved file for an ayah, if this phone has it. */
export function localAyahUri(reciter: string, surah: number, ayah: number): string | undefined {
  try {
    const F = fs();
    if (!F) return undefined;
    const file = new F.File(folder(F, reciter, surah), ayahFile(surah, ayah));
    return file.exists ? file.uri : undefined;
  } catch {
    return undefined;
  }
}

/** Download every ayah of a surah, four at a time. Resolves true when complete, false if cancelled. */
export async function downloadSurah(reciter: string, surah: number, ayahs: number, onProgress: (done: number) => void, cancelled: () => boolean): Promise<boolean> {
  const F = fs();
  if (!F) return false;
  const dir = folder(F, reciter, surah);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  let next = 1;
  let done = 0;
  const worker = async () => {
    while (next <= ayahs && !cancelled()) {
      const ayah = next++;
      const file = new F.File(dir, ayahFile(surah, ayah));
      if (!file.exists) await F.File.downloadFileAsync(ayahAudioUrl(surah, ayah, reciter), file);
      onProgress(++done);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  return !cancelled();
}

export function deleteSurahAudio(reciter: string, surah: number) {
  try {
    const F = fs();
    if (!F) return;
    const dir = folder(F, reciter, surah);
    if (dir.exists) dir.delete();
  } catch {
    // Already gone.
  }
}

type OfflineState = {
  /** "reciter/surah" → fully downloaded */
  done: Record<string, true>;
  mark: (reciter: string, surah: number) => void;
  unmark: (reciter: string, surah: number) => void;
};

export const useOfflineAudio = create<OfflineState>()(
  persist(
    (set) => ({
      done: {},
      mark: (reciter, surah) => set((s) => ({ done: { ...s.done, [`${reciter}/${surah}`]: true } })),
      unmark: (reciter, surah) =>
        set((s) => {
          const done = { ...s.done };
          delete done[`${reciter}/${surah}`];
          return { done };
        }),
    }),
    { name: 'noor.offline-audio', storage: persistStorage, version: 1 },
  ),
);
