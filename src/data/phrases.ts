// Short everyday phrases. `npm run verify` checks the letters of every Arabic phrase marked
// `verify: true` against the bundled Hisnul Muslim and Quran text, so a typo fails the check.

export const SHAHADAH = {
  ar: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ',
  tr: 'Ashhadu an la ilaha illallah, wa ashhadu anna Muhammadan rasulullah',
  trBn: 'আশহাদু আল্লা ইলাহা ইল্লাল্লাহু, ওয়া আশহাদু আন্না মুহাম্মাদার রাসূলুল্লাহ',
  en: 'I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is the Messenger of Allah.',
  bn: 'আমি সাক্ষ্য দিচ্ছি যে আল্লাহ ছাড়া কোনো সত্য উপাস্য নেই, এবং আমি সাক্ষ্য দিচ্ছি যে মুহাম্মাদ আল্লাহর রাসূল।',
  // Checked in two halves (the sources phrase the second half inside longer supplications).
  verifyParts: ['أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ', 'أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ'],
};

export type Greeting = { ar: string; tr: string; en: string; when: string; verify: boolean; trBn: string; bn: string; whenBn: string };

export const GREETINGS: Greeting[] = [
  { ar: 'السَّلَامُ عَلَيْكُمْ', tr: 'As-salamu ‘alaykum', en: 'Peace be upon you', when: 'Greeting anyone', verify: true, trBn: 'আসসালামু আলাইকুম', bn: 'আপনার ওপর শান্তি বর্ষিত হোক', whenBn: 'যেকোনো মুসলিমকে সালাম দিতে' },
  { ar: 'وَعَلَيْكُمُ السَّلَامُ', tr: 'Wa ‘alaykumus-salam', en: 'And upon you be peace', when: 'Replying to a greeting', verify: true, trBn: 'ওয়া আলাইকুমুস সালাম', bn: 'আপনার ওপরও শান্তি বর্ষিত হোক', whenBn: 'সালামের জবাবে' },
  { ar: 'بِسْمِ اللَّهِ', tr: 'Bismillah', en: 'In the name of Allah', when: 'Before starting anything, such as eating', verify: true, trBn: 'বিসমিল্লাহ', bn: 'আল্লাহর নামে', whenBn: 'যেকোনো কাজ শুরুর আগে, যেমন খাওয়ার আগে' },
  { ar: 'الْحَمْدُ لِلَّهِ', tr: 'Alhamdulillah', en: 'All praise is for Allah', when: 'Giving thanks; after sneezing', verify: true, trBn: 'আলহামদুলিল্লাহ', bn: 'সকল প্রশংসা আল্লাহর', whenBn: 'শুকরিয়া জানাতে; হাঁচির পর' },
  { ar: 'سُبْحَانَ اللَّهِ', tr: 'SubhanAllah', en: 'Glory be to Allah', when: 'On seeing something wondrous', verify: true, trBn: 'সুবহানাল্লাহ', bn: 'আল্লাহ পবিত্র ও মহান', whenBn: 'বিস্ময়কর কিছু দেখলে' },
  { ar: 'اللَّهُ أَكْبَرُ', tr: 'Allahu Akbar', en: 'Allah is the Greatest', when: 'On good news; in prayer', verify: true, trBn: 'আল্লাহু আকবার', bn: 'আল্লাহ সবচেয়ে মহান', whenBn: 'সুসংবাদে; নামাজে' },
  { ar: 'مَا شَاءَ اللَّهُ', tr: 'MashaAllah', en: 'What Allah has willed', when: 'Admiring something good', verify: true, trBn: 'মাশাআল্লাহ', bn: 'আল্লাহ যা চেয়েছেন', whenBn: 'ভালো কিছুর প্রশংসা করতে' },
  { ar: 'إِنْ شَاءَ اللَّهُ', tr: 'InshaAllah', en: 'If Allah wills', when: 'Speaking of the future', verify: true, trBn: 'ইনশাআল্লাহ', bn: 'আল্লাহ চাইলে', whenBn: 'ভবিষ্যতের কথা বলার সময়' },
  { ar: 'جَزَاكَ اللَّهُ خَيْرًا', tr: 'JazakAllahu khayran', en: 'May Allah reward you with good', when: 'Thanking someone', verify: true, trBn: 'জাযাকাল্লাহু খাইরান', bn: 'আল্লাহ আপনাকে উত্তম প্রতিদান দিন', whenBn: 'কাউকে ধন্যবাদ জানাতে' },
  // Checked by hand: the sources only contain the reply form «وَفِيكَ بَارَكَ اللَّهُ» (Hisnul Muslim 93).
  { ar: 'بَارَكَ اللَّهُ فِيكَ', tr: 'BarakAllahu fik', en: 'May Allah bless you', when: 'Returning thanks or good wishes', verify: false, trBn: 'বারাকাল্লাহু ফীক', bn: 'আল্লাহ আপনাকে বরকত দিন', whenBn: 'ধন্যবাদ বা শুভকামনার জবাবে' },
  { ar: 'أَسْتَغْفِرُ اللَّهَ', tr: 'Astaghfirullah', en: 'I seek Allah’s forgiveness', when: 'After a mistake; any time', verify: true, trBn: 'আস্তাগফিরুল্লাহ', bn: 'আমি আল্লাহর কাছে ক্ষমা চাই', whenBn: 'ভুল হলে; যেকোনো সময়' },
  { ar: 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ', tr: 'Inna lillahi wa inna ilayhi raji‘un', en: 'We belong to Allah and to Him we return', when: 'On hearing of a death or loss', verify: true, trBn: 'ইন্না লিল্লাহি ওয়া ইন্না ইলাইহি রাজিউন', bn: 'আমরা আল্লাহরই এবং তাঁর কাছেই ফিরে যাব', whenBn: 'মৃত্যু বা বিপদের সংবাদে' },
  { ar: 'عِيدٌ مُبَارَكٌ', tr: 'Eid Mubarak', en: 'Blessed Eid', when: 'On the days of Eid', verify: false, trBn: 'ঈদ মোবারক', bn: 'বরকতময় ঈদ', whenBn: 'ঈদের দিনগুলোতে' },
  { ar: 'رَمَضَانُ مُبَارَكٌ', tr: 'Ramadan Mubarak', en: 'Blessed Ramadan', when: 'At the start of Ramadan', verify: false, trBn: 'রমজান মোবারক', bn: 'বরকতময় রমজান', whenBn: 'রমজানের শুরুতে' },
];
