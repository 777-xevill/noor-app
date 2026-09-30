// The 28 letters of the Arabic alphabet in their usual order, with the names they are called by.
// (Letter shapes and names, not religious text. scripts/verify checks there are 28 distinct letters.)
export type ArabicLetter = { letter: string; name: string; nameBn: string; sound: string };

export const ALPHABET: ArabicLetter[] = [
  { letter: 'ا', name: 'Alif', nameBn: 'আলিফ', sound: 'a' },
  { letter: 'ب', name: 'Baa', nameBn: 'বা', sound: 'b' },
  { letter: 'ت', name: 'Taa', nameBn: 'তা', sound: 't' },
  { letter: 'ث', name: 'Thaa', nameBn: 'ছা', sound: 'th' },
  { letter: 'ج', name: 'Jeem', nameBn: 'জীম', sound: 'j' },
  { letter: 'ح', name: 'Haa', nameBn: 'হা', sound: 'h' },
  { letter: 'خ', name: 'Khaa', nameBn: 'খা', sound: 'kh' },
  { letter: 'د', name: 'Daal', nameBn: 'দাল', sound: 'd' },
  { letter: 'ذ', name: 'Dhaal', nameBn: 'যাল', sound: 'dh' },
  { letter: 'ر', name: 'Raa', nameBn: 'রা', sound: 'r' },
  { letter: 'ز', name: 'Zaay', nameBn: 'যা', sound: 'z' },
  { letter: 'س', name: 'Seen', nameBn: 'সীন', sound: 's' },
  { letter: 'ش', name: 'Sheen', nameBn: 'শীন', sound: 'sh' },
  { letter: 'ص', name: 'Saad', nameBn: 'সাদ', sound: 's' },
  { letter: 'ض', name: 'Daad', nameBn: 'দাদ', sound: 'd' },
  { letter: 'ط', name: 'Taa', nameBn: 'ত্বা', sound: 't' },
  { letter: 'ظ', name: 'Zaa', nameBn: 'যা', sound: 'z' },
  { letter: 'ع', name: 'Ayn', nameBn: 'আইন', sound: '‘' },
  { letter: 'غ', name: 'Ghayn', nameBn: 'গাইন', sound: 'gh' },
  { letter: 'ف', name: 'Faa', nameBn: 'ফা', sound: 'f' },
  { letter: 'ق', name: 'Qaaf', nameBn: 'ক্বাফ', sound: 'q' },
  { letter: 'ك', name: 'Kaaf', nameBn: 'কাফ', sound: 'k' },
  { letter: 'ل', name: 'Laam', nameBn: 'লাম', sound: 'l' },
  { letter: 'م', name: 'Meem', nameBn: 'মীম', sound: 'm' },
  { letter: 'ن', name: 'Noon', nameBn: 'নূন', sound: 'n' },
  { letter: 'ه', name: 'Haa', nameBn: 'হা', sound: 'h' },
  { letter: 'و', name: 'Waaw', nameBn: 'ওয়াও', sound: 'w' },
  { letter: 'ي', name: 'Yaa', nameBn: 'ইয়া', sound: 'y' },
];
