import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSettings } from '@/features/settings/store';

type Fs = typeof import('expo-file-system');
const fs = (): Fs | null => (Platform.OS === 'web' ? null : (require('expo-file-system') as Fs));

/**
 * Let the user choose a profile photo from their library (cropped square), and keep a copy in the
 * app's own storage so it survives the picker's cache being cleared. The photo never leaves the phone.
 * Uses the system photo picker, so no gallery permission is needed on recent Android.
 */
export async function pickAvatar(): Promise<boolean> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
  const picked = res.canceled ? undefined : res.assets?.[0]?.uri;
  if (!picked) return false;
  const F = fs();
  const { avatarUri, set } = useSettings.getState();
  if (!F) {
    set({ avatarUri: picked });
    return true;
  }
  const dest = new F.File(F.Paths.document, `avatar-${Date.now()}.jpg`);
  await new F.File(picked).copy(dest);
  set({ avatarUri: dest.uri });
  removeFile(F, avatarUri);
  return true;
}

export function removeAvatar() {
  const { avatarUri, set } = useSettings.getState();
  set({ avatarUri: '' });
  const F = fs();
  if (F) removeFile(F, avatarUri);
}

function removeFile(F: Fs, uri: string) {
  if (!uri) return;
  try {
    const old = new F.File(uri);
    if (old.exists) old.delete();
  } catch {
    // Already gone.
  }
}
