// The 28 letters of the Arabic alphabet in their usual order, with the names they are called by.
// (Letter shapes and names, not religious text. scripts/verify checks there are 28 distinct letters.)
/** `ar`: the letter's name in Arabic, which the phone's Arabic voice reads aloud when a child taps it. */
export type ArabicLetter = { letter: string; ar: string; name: string; nameBn: string; sound: string };

export const ALPHABET: ArabicLetter[] = [
  { letter: 'ا', ar: 'أَلِف', name: 'Alif', nameBn: 'আলিফ', sound: 'a' },
  { letter: 'ب', ar: 'بَاء', name: 'Baa', nameBn: 'বা', sound: 'b' },
  { letter: 'ت', ar: 'تَاء', name: 'Taa', nameBn: 'তা', sound: 't' },
  { letter: 'ث', ar: 'ثَاء', name: 'Thaa', nameBn: 'ছা', sound: 'th' },
  { letter: 'ج', ar: 'جِيم', name: 'Jeem', nameBn: 'জীম', sound: 'j' },
  { letter: 'ح', ar: 'حَاء', name: 'Haa', nameBn: 'হা', sound: 'h' },
  { letter: 'خ', ar: 'خَاء', name: 'Khaa', nameBn: 'খা', sound: 'kh' },
  { letter: 'د', ar: 'دَال', name: 'Daal', nameBn: 'দাল', sound: 'd' },
  { letter: 'ذ', ar: 'ذَال', name: 'Dhaal', nameBn: 'যাল', sound: 'dh' },
  { letter: 'ر', ar: 'رَاء', name: 'Raa', nameBn: 'রা', sound: 'r' },
  { letter: 'ز', ar: 'زَاي', name: 'Zaay', nameBn: 'যা', sound: 'z' },
  { letter: 'س', ar: 'سِين', name: 'Seen', nameBn: 'সীন', sound: 's' },
  { letter: 'ش', ar: 'شِين', name: 'Sheen', nameBn: 'শীন', sound: 'sh' },
  { letter: 'ص', ar: 'صَاد', name: 'Saad', nameBn: 'সাদ', sound: 's' },
  { letter: 'ض', ar: 'ضَاد', name: 'Daad', nameBn: 'দাদ', sound: 'd' },
  { letter: 'ط', ar: 'طَاء', name: 'Taa', nameBn: 'ত্বা', sound: 't' },
  { letter: 'ظ', ar: 'ظَاء', name: 'Zaa', nameBn: 'যা', sound: 'z' },
  { letter: 'ع', ar: 'عَيْن', name: 'Ayn', nameBn: 'আইন', sound: '‘' },
  { letter: 'غ', ar: 'غَيْن', name: 'Ghayn', nameBn: 'গাইন', sound: 'gh' },
  { letter: 'ف', ar: 'فَاء', name: 'Faa', nameBn: 'ফা', sound: 'f' },
  { letter: 'ق', ar: 'قَاف', name: 'Qaaf', nameBn: 'ক্বাফ', sound: 'q' },
  { letter: 'ك', ar: 'كَاف', name: 'Kaaf', nameBn: 'কাফ', sound: 'k' },
  { letter: 'ل', ar: 'لَام', name: 'Laam', nameBn: 'লাম', sound: 'l' },
  { letter: 'م', ar: 'مِيم', name: 'Meem', nameBn: 'মীম', sound: 'm' },
  { letter: 'ن', ar: 'نُون', name: 'Noon', nameBn: 'নূন', sound: 'n' },
  { letter: 'ه', ar: 'هَاء', name: 'Haa', nameBn: 'হা', sound: 'h' },
  { letter: 'و', ar: 'وَاو', name: 'Waaw', nameBn: 'ওয়াও', sound: 'w' },
  { letter: 'ي', ar: 'يَاء', name: 'Yaa', nameBn: 'ইয়া', sound: 'y' },
];
