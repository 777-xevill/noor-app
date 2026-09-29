// Excerpts copied programmatically from the bundled Tanzil / Saheeh International text.
// `npm run verify` checks each Arabic excerpt is an exact prefix of its ayah (after any ۞ quarter
// mark, which isn't shown in an excerpt).

export const QURAN_EXCERPTS = {
  names: { surah: 7, ayah: 180, ref: 'Al-A’raf 7:180', ar: "وَلِلَّهِ ٱلْأَسْمَآءُ ٱلْحُسْنَىٰ فَٱدْعُوهُ بِهَا", en: "And to Allah belong the best names, so invoke Him by them." },
  noor: { surah: 24, ayah: 35, ref: 'An-Nur 24:35', ar: "ٱللَّهُ نُورُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ ۚ مَثَلُ نُورِهِۦ كَمِشْكَوٰةٍۢ فِيهَا مِصْبَاحٌ", en: "Allah is the Light of the heavens and the earth. The example of His light is like a niche within which is a lamp", bn: "আল্লাহ নভোমন্ডল ও ভূমন্ডলের জ্যোতি, তাঁর জ্যোতির উদাহরণ যেন একটি কুলঙ্গি, যাতে আছে একটি প্রদীপ" },
} as const;
