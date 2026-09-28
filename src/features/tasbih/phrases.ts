// Short dhikr phrases. Their letters are checked against the Hisnul Muslim text by
// `npm run verify`, so a typo in the Arabic fails the build check.
// `trBn` / `bn`: pronunciation and meaning for Bangla readers.
export type Phrase = { id: string; ar: string; tr: string; en: string; trBn: string; bn: string };

export const PHRASES: Phrase[] = [
  { id: 'subhanallah', ar: 'سُبْحَانَ اللَّهِ', tr: 'SubhanAllah', en: 'Glory be to Allah', trBn: 'সুবহানাল্লাহ', bn: 'আল্লাহ পবিত্র ও মহান' },
  { id: 'alhamdulillah', ar: 'الْحَمْدُ لِلَّهِ', tr: 'Alhamdulillah', en: 'All praise is for Allah', trBn: 'আলহামদুলিল্লাহ', bn: 'সকল প্রশংসা আল্লাহর' },
  { id: 'allahuakbar', ar: 'اللَّهُ أَكْبَرُ', tr: 'Allahu Akbar', en: 'Allah is the Greatest', trBn: 'আল্লাহু আকবার', bn: 'আল্লাহ সবচেয়ে মহান' },
  { id: 'tahlil', ar: 'لَا إِلَهَ إِلَّا اللَّهُ', tr: 'La ilaha illallah', en: 'None has the right to be worshipped except Allah', trBn: 'লা ইলাহা ইল্লাল্লাহ', bn: 'আল্লাহ ছাড়া কোনো সত্য উপাস্য নেই' },
  { id: 'istighfar', ar: 'أَسْتَغْفِرُ اللَّهَ', tr: 'Astaghfirullah', en: 'I seek Allah’s forgiveness', trBn: 'আস্তাগফিরুল্লাহ', bn: 'আমি আল্লাহর কাছে ক্ষমা চাই' },
  { id: 'subhanallahwabihamdihi', ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', tr: 'SubhanAllahi wa bihamdihi', en: 'Glory be to Allah and praise be to Him', trBn: 'সুবহানাল্লাহি ওয়া বিহামদিহি', bn: 'আল্লাহ পবিত্র, এবং সকল প্রশংসা তাঁরই' },
  { id: 'hawqala', ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', tr: 'La hawla wa la quwwata illa billah', en: 'There is no might nor power except with Allah', trBn: 'লা হাওলা ওয়া লা কুওয়াতা ইল্লা বিল্লাহ', bn: 'আল্লাহর সাহায্য ছাড়া কোনো শক্তি ও সামর্থ্য নেই' },
  { id: 'salawat', ar: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', tr: 'Allahumma salli ‘ala Muhammad', en: 'O Allah, send prayers upon Muhammad', trBn: 'আল্লাহুম্মা সাল্লি আলা মুহাম্মাদ', bn: 'হে আল্লাহ, মুহাম্মাদ (সা.)-এর ওপর রহমত বর্ষণ করুন' },
];

/** After each obligatory prayer: SubhanAllah 33, Alhamdulillah 33, Allahu Akbar 34 (100 in total). */
export const AFTER_PRAYER: { phraseId: string; count: number }[] = [
  { phraseId: 'subhanallah', count: 33 },
  { phraseId: 'alhamdulillah', count: 33 },
  { phraseId: 'allahuakbar', count: 34 },
];
