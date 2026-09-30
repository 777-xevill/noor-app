// A child-friendly outline of how the prayer is performed. Like the Hajj guide (src/data/hajj.ts) this was
// WRITTEN for Noor rather than fetched from a source, so it carries a "not yet reviewed" notice until a
// qualified scholar has checked it; then set KIDS_REVIEWED to true. It is the basic outline only; a parent
// or teacher should show a child how to pray.
export const KIDS_REVIEWED = false;

export type KidsStep = { id: string; en: string; bn: string; textEn: string; textBn: string };

export const KIDS_SALAH: KidsStep[] = [
  { id: 'wudu', en: 'Make wudu', bn: 'ওযু করি', textEn: 'Wash your hands, mouth, nose, face, arms, wipe your head, and wash your feet.', textBn: 'হাত, মুখ, নাক, চেহারা ও বাহু ধুই, মাথা মাসেহ করি এবং পা ধুই।' },
  { id: 'qibla', en: 'Face the Qibla', bn: 'কিবলার দিকে ফিরি', textEn: 'Stand on a clean place facing the Kaaba. The Qibla screen in Noor shows the way.', textBn: 'পরিষ্কার জায়গায় কাবার দিকে মুখ করে দাঁড়াই। নূরের কিবলা স্ক্রিন দিক দেখায়।' },
  { id: 'takbir', en: 'Say “Allahu akbar”', bn: '“আল্লাহু আকবার” বলি', textEn: 'Raise your hands and say “Allahu akbar” to begin the prayer.', textBn: 'হাত তুলে “আল্লাহু আকবার” বলে নামাজ শুরু করি।' },
  { id: 'qiyam', en: 'Stand and recite', bn: 'দাঁড়িয়ে পড়ি', textEn: 'Stand and recite Al-Fatiha, then another short surah.', textBn: 'দাঁড়িয়ে সূরা ফাতিহা পড়ি, তারপর আরেকটি ছোট সূরা।' },
  { id: 'ruku', en: 'Bow (ruku‘)', bn: 'রুকু করি', textEn: 'Say “Allahu akbar” and bow with your back straight.', textBn: '“আল্লাহু আকবার” বলে পিঠ সোজা রেখে রুকুতে যাই।' },
  { id: 'rise', en: 'Stand up again', bn: 'আবার সোজা হই', textEn: 'Rise up straight from the bow.', textBn: 'রুকু থেকে সোজা হয়ে দাঁড়াই।' },
  { id: 'sujood', en: 'Prostrate (sujood)', bn: 'সিজদা করি', textEn: 'Say “Allahu akbar” and place your forehead, nose, hands, knees and toes on the ground. Sit briefly, then prostrate a second time.', textBn: '“আল্লাহু আকবার” বলে কপাল, নাক, হাত, হাঁটু ও পায়ের আঙুল মাটিতে রাখি। একটু বসে দ্বিতীয় সিজদা করি।' },
  { id: 'finish', en: 'Sit and finish', bn: 'বসে শেষ করি', textEn: 'After the last rak‘ah, sit, recite the tashahhud your teacher taught you, then turn your face right and left saying “Assalamu alaykum wa rahmatullah”.', textBn: 'শেষ রাকাতের পর বসে উস্তাদের শেখানো তাশাহহুদ পড়ি, তারপর ডানে ও বামে মুখ ফিরিয়ে “আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ” বলি।' },
];

/** Hisnul Muslim chapters (see src/data/duaChapters.ts) for the duas children learn first. */
export const KIDS_DUAS: { chapter: number; key: 'wake' | 'eat' | 'ateDone' | 'leave' | 'enter' | 'sleep' | 'wudu' | 'travel' }[] = [
  { chapter: 1, key: 'wake' },
  { chapter: 8, key: 'wudu' },
  { chapter: 69, key: 'eat' },
  { chapter: 70, key: 'ateDone' },
  { chapter: 10, key: 'leave' },
  { chapter: 11, key: 'enter' },
  { chapter: 28, key: 'sleep' },
  { chapter: 96, key: 'travel' },
];
