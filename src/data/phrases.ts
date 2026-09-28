// Short everyday phrases. `npm run verify` checks the letters of every Arabic phrase marked
// `verify: true` against the bundled Hisnul Muslim and Quran text, so a typo fails the check.

export const SHAHADAH = {
  ar: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ',
  tr: 'Ashhadu an la ilaha illallah, wa ashhadu anna Muhammadan rasulullah',
  en: 'I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is the Messenger of Allah.',
  bn: 'আমি সাক্ষ্য দিচ্ছি যে আল্লাহ ছাড়া কোনো সত্য উপাস্য নেই, এবং আমি সাক্ষ্য দিচ্ছি যে মুহাম্মাদ আল্লাহর রাসূল।',
  // Checked in two halves (the sources phrase the second half inside longer supplications).
  verifyParts: ['أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ', 'أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ'],
};

export type Greeting = { ar: string; tr: string; en: string; when: string; verify: boolean };

export const GREETINGS: Greeting[] = [
  { ar: 'السَّلَامُ عَلَيْكُمْ', tr: 'As-salamu ‘alaykum', en: 'Peace be upon you', when: 'Greeting anyone', verify: true },
  { ar: 'وَعَلَيْكُمُ السَّلَامُ', tr: 'Wa ‘alaykumus-salam', en: 'And upon you be peace', when: 'Replying to a greeting', verify: true },
  { ar: 'بِسْمِ اللَّهِ', tr: 'Bismillah', en: 'In the name of Allah', when: 'Before starting anything, such as eating', verify: true },
  { ar: 'الْحَمْدُ لِلَّهِ', tr: 'Alhamdulillah', en: 'All praise is for Allah', when: 'Giving thanks; after sneezing', verify: true },
  { ar: 'سُبْحَانَ اللَّهِ', tr: 'SubhanAllah', en: 'Glory be to Allah', when: 'On seeing something wondrous', verify: true },
  { ar: 'اللَّهُ أَكْبَرُ', tr: 'Allahu Akbar', en: 'Allah is the Greatest', when: 'On good news; in prayer', verify: true },
  { ar: 'مَا شَاءَ اللَّهُ', tr: 'MashaAllah', en: 'What Allah has willed', when: 'Admiring something good', verify: true },
  { ar: 'إِنْ شَاءَ اللَّهُ', tr: 'InshaAllah', en: 'If Allah wills', when: 'Speaking of the future', verify: true },
  { ar: 'جَزَاكَ اللَّهُ خَيْرًا', tr: 'JazakAllahu khayran', en: 'May Allah reward you with good', when: 'Thanking someone', verify: true },
  // Checked by hand: the sources only contain the reply form «وَفِيكَ بَارَكَ اللَّهُ» (Hisnul Muslim 93).
  { ar: 'بَارَكَ اللَّهُ فِيكَ', tr: 'BarakAllahu fik', en: 'May Allah bless you', when: 'Returning thanks or good wishes', verify: false },
  { ar: 'أَسْتَغْفِرُ اللَّهَ', tr: 'Astaghfirullah', en: 'I seek Allah’s forgiveness', when: 'After a mistake; any time', verify: true },
  { ar: 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ', tr: 'Inna lillahi wa inna ilayhi raji‘un', en: 'We belong to Allah and to Him we return', when: 'On hearing of a death or loss', verify: true },
  { ar: 'عِيدٌ مُبَارَكٌ', tr: 'Eid Mubarak', en: 'Blessed Eid', when: 'On the days of Eid', verify: false },
  { ar: 'رَمَضَانُ مُبَارَكٌ', tr: 'Ramadan Mubarak', en: 'Blessed Ramadan', when: 'At the start of Ramadan', verify: false },
];
