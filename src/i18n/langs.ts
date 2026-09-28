import { getLocales } from 'expo-localization';

export type Lang = 'en' | 'bn';

export const LANGS: { code: Lang; name: string; english: string; rtl: boolean }[] = [
  { code: 'en', name: 'English', english: 'English', rtl: false },
  { code: 'bn', name: 'বাংলা', english: 'Bangla', rtl: false },
];

const DIGITS: Partial<Record<Lang, string>> = {
  bn: '০১২৩৪৫৬৭৮৯',
};

/** Replace Latin digits with the language's own numerals (Bangla ০-৯). */
export function localDigits(text: string | number, lang: Lang): string {
  const s = String(text);
  const set = DIGITS[lang];
  return set ? s.replace(/[0-9]/g, (d) => set[Number(d)]) : s;
}

/** The device language if we support it, otherwise English. */
export function deviceLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode;
    return code === 'bn' ? 'bn' : 'en';
  } catch {
    return 'en';
  }
}
