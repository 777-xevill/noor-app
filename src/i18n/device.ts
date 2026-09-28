import { getLocales } from 'expo-localization';
import type { Lang } from './langs';

/** The phone's language, if the app speaks it. */
export function deviceLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode;
    return code === 'bn' ? 'bn' : 'en';
  } catch {
    return 'en';
  }
}
