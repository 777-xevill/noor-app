// Short dhikr phrases. Their letters are checked against the Hisnul Muslim text by
// `npm run verify`, so a typo in the Arabic fails the build check.
export type Phrase = { id: string; ar: string; tr: string; en: string };

export const PHRASES: Phrase[] = [
  { id: 'subhanallah', ar: 'سُبْحَانَ اللَّهِ', tr: 'SubhanAllah', en: 'Glory be to Allah' },
  { id: 'alhamdulillah', ar: 'الْحَمْدُ لِلَّهِ', tr: 'Alhamdulillah', en: 'All praise is for Allah' },
  { id: 'allahuakbar', ar: 'اللَّهُ أَكْبَرُ', tr: 'Allahu Akbar', en: 'Allah is the Greatest' },
  { id: 'tahlil', ar: 'لَا إِلَهَ إِلَّا اللَّهُ', tr: 'La ilaha illallah', en: 'None has the right to be worshipped except Allah' },
  { id: 'istighfar', ar: 'أَسْتَغْفِرُ اللَّهَ', tr: 'Astaghfirullah', en: 'I seek Allah’s forgiveness' },
  { id: 'subhanallahwabihamdihi', ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', tr: 'SubhanAllahi wa bihamdihi', en: 'Glory be to Allah and praise be to Him' },
  { id: 'hawqala', ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', tr: 'La hawla wa la quwwata illa billah', en: 'There is no might nor power except with Allah' },
  { id: 'salawat', ar: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', tr: 'Allahumma salli ‘ala Muhammad', en: 'O Allah, send prayers upon Muhammad' },
];

/** After each obligatory prayer: SubhanAllah 33, Alhamdulillah 33, Allahu Akbar 34 (100 in total). */
export const AFTER_PRAYER: { phraseId: string; count: number }[] = [
  { phraseId: 'subhanallah', count: 33 },
  { phraseId: 'alhamdulillah', count: 33 },
  { phraseId: 'allahuakbar', count: 34 },
];
