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
  'HindSiliguri-Regular': require('@expo-google-fonts/hind-siliguri/400Regular/HindSiliguri_400Regular.ttf'),
  'HindSiliguri-Medium': require('@expo-google-fonts/hind-siliguri/500Medium/HindSiliguri_500Medium.ttf'),
  'HindSiliguri-SemiBold': require('@expo-google-fonts/hind-siliguri/600SemiBold/HindSiliguri_600SemiBold.ttf'),
  'HindSiliguri-Bold': require('@expo-google-fonts/hind-siliguri/700Bold/HindSiliguri_700Bold.ttf'),
};

/** Geist family → Bangla equivalent at the same weight. */
export const BANGLA_FAMILY: Record<string, string> = {
  'Geist-Regular': 'HindSiliguri-Regular',
  'Geist-Medium': 'HindSiliguri-Medium',
  'Geist-SemiBold': 'HindSiliguri-SemiBold',
  'Geist-Bold': 'HindSiliguri-Bold',
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
