import type { TextStyle } from 'react-native';
import { fonts } from './fonts';

// One type scale for the whole app. Custom fonts carry their weight in the family name,
// so never set fontWeight alongside these (Android ignores it and iOS may fake-bold).
export const type = {
  display: { fontFamily: fonts.semibold, fontSize: 64, lineHeight: 66, letterSpacing: -2.6 },
  h1: { fontFamily: fonts.semibold, fontSize: 28, lineHeight: 33, letterSpacing: -0.9 },
  h2: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 24, letterSpacing: -0.35 },
  title: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21, letterSpacing: -0.15 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 17 },
  micro: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' },
  arabic: { fontFamily: fonts.arabic, fontSize: 26, lineHeight: 50, writingDirection: 'rtl', textAlign: 'right' },
  quran: { fontFamily: fonts.quran, fontSize: 30, lineHeight: 64, writingDirection: 'rtl', textAlign: 'right' },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
