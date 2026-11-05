// A child-friendly outline of how the prayer is performed. Like the Hajj guide (src/data/hajj.ts) this was
// WRITTEN for Noor rather than fetched from a source. It was compared with published guides (store/SOURCE_CHECK.md)
// and says no scholar has reviewed it in person until one has; then set KIDS_REVIEWED to true. It is the basic outline only; a parent
// or teacher should show a child how to pray.
export const KIDS_REVIEWED = false;

export type KidsStep = { id: string; en: string; bn: string; textEn: string; textBn: string };

export const KIDS_SALAH: KidsStep[] = [
  { id: 'wudu', en: 'Make wudu', bn: 'ওযু করি', textEn: 'Wash your hands, mouth, nose, face, arms, wipe your head, and wash your feet.', textBn: 'হাত, মুখ, নাক, চেহারা ও বাহু ধুই, মাথা মাসেহ করি এবং পা ধুই।' },
  { id: 'qibla', en: 'Face the Qibla', bn: 'কিবলার দিকে ফিরি', textEn: 'Stand on a clean place facing the Kaaba, and know in your heart which prayer you are about to pray. The Qibla screen in Noor shows the way.', textBn: 'পরিষ্কার জায়গায় কাবার দিকে মুখ করে দাঁড়াই, আর মনে মনে ঠিক করি কোন নামাজ পড়ছি। নূরের কিবলা স্ক্রিন দিক দেখায়।' },
  { id: 'takbir', en: 'Say “Allahu akbar”', bn: '“আল্লাহু আকবার” বলি', textEn: 'Raise your hands and say “Allahu akbar” to begin the prayer.', textBn: 'হাত তুলে “আল্লাহু আকবার” বলে নামাজ শুরু করি।' },
  { id: 'qiyam', en: 'Stand and recite', bn: 'দাঁড়িয়ে পড়ি', textEn: 'Stand and recite Al-Fatiha, then another short surah.', textBn: 'দাঁড়িয়ে সূরা ফাতিহা পড়ি, তারপর আরেকটি ছোট সূরা।' },
  { id: 'ruku', en: 'Bow (ruku‘)', bn: 'রুকু করি', textEn: 'Say “Allahu akbar” and bow with your back straight. Say the words of praise your teacher taught you.', textBn: '“আল্লাহু আকবার” বলে পিঠ সোজা রেখে রুকুতে যাই। উস্তাদের শেখানো তাসবিহ পড়ি।' },
  { id: 'rise', en: 'Stand up again', bn: 'আবার সোজা হই', textEn: 'Rise up straight from the bow.', textBn: 'রুকু থেকে সোজা হয়ে দাঁড়াই।' },
  { id: 'sujood', en: 'Prostrate (sujood)', bn: 'সিজদা করি', textEn: 'Say “Allahu akbar” and place your forehead, nose, hands, knees and toes on the ground. Say the words of praise your teacher taught you. Sit briefly, then prostrate a second time.', textBn: '“আল্লাহু আকবার” বলে কপাল, নাক, হাত, হাঁটু ও পায়ের আঙুল মাটিতে রাখি। উস্তাদের শেখানো তাসবিহ পড়ি। একটু বসে দ্বিতীয় সিজদা করি।' },
  { id: 'repeat', en: 'The next rak‘ah', bn: 'পরের রাকাত', textEn: 'That is one rak‘ah. Stand and do the same again for the next one. In a prayer of three or four rak‘ahs, sit for the tashahhud after the second rak‘ah before you stand, and in the third and fourth rak‘ahs of a fard prayer recite only Al-Fatiha.', textBn: 'এই হলো এক রাকাত। দাঁড়িয়ে পরের রাকাতেও একইভাবে করি। তিন বা চার রাকাতের নামাজে দ্বিতীয় রাকাতের পর বসে তাশাহহুদ পড়ে তারপর দাঁড়াই, আর ফরজ নামাজের তৃতীয় ও চতুর্থ রাকাতে শুধু সূরা ফাতিহা পড়ি।' },
  { id: 'finish', en: 'Sit and finish', bn: 'বসে শেষ করি', textEn: 'After the last rak‘ah, sit, recite the tashahhud and salawat your teacher taught you, then turn your face right and left saying “Assalamu alaykum wa rahmatullah”.', textBn: 'শেষ রাকাতের পর বসে উস্তাদের শেখানো তাশাহহুদ ও দরুদ পড়ি, তারপর ডানে ও বামে মুখ ফিরিয়ে “আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ” বলি।' },
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
