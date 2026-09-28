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
