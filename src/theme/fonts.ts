// Load only the weights we use (the package index would bundle all 36 font files).
export const fontAssets = {
  'Geist-Regular': require('@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf'),
  'Geist-Medium': require('@expo-google-fonts/geist/500Medium/Geist_500Medium.ttf'),
  'Geist-SemiBold': require('@expo-google-fonts/geist/600SemiBold/Geist_600SemiBold.ttf'),
  'Geist-Bold': require('@expo-google-fonts/geist/700Bold/Geist_700Bold.ttf'),
  'Amiri-Regular': require('@expo-google-fonts/amiri/400Regular/Amiri_400Regular.ttf'),
  'Amiri-Bold': require('@expo-google-fonts/amiri/700Bold/Amiri_700Bold.ttf'),
  // Amiri Quran is drawn for the Uthmani script (small high letters, pause marks, rounded zeros).
  'AmiriQuran-Regular': require('@expo-google-fonts/amiri-quran/400Regular/AmiriQuran_400Regular.ttf'),
  // Bangla UI (also covers Latin), used in place of Geist when the app language is Bangla.
  // Noto Sans Bengali, not Hind Siliguri: Hind draws the digit ১ as a small half-height hook, so
  // times like ১১:৪৯ looked cut in half. Noto's digits are all full height (and it's Android's own Bangla face).
  'NotoBengali-Regular': require('@expo-google-fonts/noto-sans-bengali/400Regular/NotoSansBengali_400Regular.ttf'),
  'NotoBengali-Medium': require('@expo-google-fonts/noto-sans-bengali/500Medium/NotoSansBengali_500Medium.ttf'),
  'NotoBengali-SemiBold': require('@expo-google-fonts/noto-sans-bengali/600SemiBold/NotoSansBengali_600SemiBold.ttf'),
  'NotoBengali-Bold': require('@expo-google-fonts/noto-sans-bengali/700Bold/NotoSansBengali_700Bold.ttf'),
};

/** Geist family → Bangla equivalent at the same weight. */
export const BANGLA_FAMILY: Record<string, string> = {
  'Geist-Regular': 'NotoBengali-Regular',
  'Geist-Medium': 'NotoBengali-Medium',
  'Geist-SemiBold': 'NotoBengali-SemiBold',
  'Geist-Bold': 'NotoBengali-Bold',
};

export const fonts = {
  regular: 'Geist-Regular',
  medium: 'Geist-Medium',
  semibold: 'Geist-SemiBold',
  bold: 'Geist-Bold',
  arabic: 'Amiri-Regular',
  arabicBold: 'Amiri-Bold',
  quran: 'AmiriQuran-Regular',
} as const;
