// Hajj and Umrah guide. Unlike the Quran, hadith and dua texts, which are fetched from named sources by
// scripts/data/fetch_data.py, these summaries were WRITTEN for Noor, so they are held to a stricter rule:
// they are shown with a "not yet reviewed" notice until a qualified scholar has checked them, and only
// then should HAJJ_REVIEWED be set to true (with the reviewer's name in REVIEWED_BY).
//
// They describe the widely agreed outline only. Schools of thought differ on details (combining prayers,
// what may be done before or after another rite, and so on), so every screen tells pilgrims to follow the
// guidance of their group's scholar. The duas are not retyped here; each step points at the Hisnul Muslim
// chapter (see src/data/duaChapters.ts) so the words come from the same verified source as the Duas screen.

export const HAJJ_REVIEWED = false;
export const REVIEWED_BY: string | null = null;

export type Step = {
  id: string;
  en: string;
  bn: string;
  textEn: string;
  textBn: string;
  /** Hisnul Muslim chapter ids for the duas of this rite */
  duas?: number[];
};

export const UMRAH: Step[] = [
  {
    id: 'ihram',
    en: 'Ihram',
    bn: 'ইহরাম',
    textEn:
      'Umrah begins at the miqat, the boundary point on your route. Bathe or make wudu, and put on the ihram clothing: for men, two plain unstitched white sheets; for women, their usual modest dress. Make the intention for Umrah and begin saying the Talbiyah. While in ihram, avoid what it forbids, such as cutting hair or nails, using perfume, hunting and marital relations. Men do not cover the head.',
    textBn:
      'উমরা শুরু হয় মীকাত থেকে, অর্থাৎ আপনার পথের নির্ধারিত সীমানা থেকে। গোসল বা ওযু করে ইহরামের পোশাক পরুন: পুরুষদের জন্য সেলাইবিহীন দুটি সাদা চাদর, নারীদের জন্য তাঁদের স্বাভাবিক শালীন পোশাক। উমরার নিয়ত করুন এবং তালবিয়া পড়া শুরু করুন। ইহরাম অবস্থায় যা নিষিদ্ধ তা থেকে বিরত থাকুন, যেমন চুল বা নখ কাটা, সুগন্ধি ব্যবহার, শিকার ও স্ত্রীসহবাস। পুরুষেরা মাথা ঢাকেন না।',
    duas: [115],
  },
  {
    id: 'tawaf',
    en: 'Tawaf',
    bn: 'তাওয়াফ',
    textEn:
      'At the Haram, go to the Kaaba. Tawaf is seven circuits around the Kaaba, keeping it on your left, starting and ending at the Black Stone, and you should be in wudu. Afterwards pray two rak‘ahs behind the Maqam Ibrahim if you can, or elsewhere in the mosque if it is crowded, and drink Zamzam.',
    textBn:
      'হারামে পৌঁছে কাবার কাছে যান। তাওয়াফ হলো কাবার চারপাশে সাত চক্কর, কাবা থাকবে আপনার বাঁ দিকে, হাজরে আসওয়াদ থেকে শুরু ও সেখানেই শেষ, আর ওযু অবস্থায় থাকতে হয়। তারপর সম্ভব হলে মাকামে ইবরাহীমের পেছনে দুই রাকাত নামাজ পড়ুন, ভিড় থাকলে মসজিদের অন্য কোথাও পড়ুন, এবং যমযমের পানি পান করুন।',
    duas: [116, 117],
  },
  {
    id: 'sai',
    en: 'Sa‘i',
    bn: 'সাঈ',
    textEn:
      'Go to Safa and walk to Marwa, then back: seven trips in all, beginning at Safa and ending at Marwa. Between the green markers, men walk at a quick pace.',
    textBn:
      'সাফা থেকে মারওয়ায় যান, তারপর ফিরে আসুন: মোট সাতবার, সাফা থেকে শুরু আর মারওয়ায় শেষ। সবুজ চিহ্নের মাঝের অংশে পুরুষেরা দ্রুত হাঁটেন।',
    duas: [118],
  },
  {
    id: 'halq',
    en: 'Shaving or trimming',
    bn: 'মাথা মুণ্ডন বা চুল ছাঁটা',
    textEn:
      'Men shave the head or trim the hair; women trim a small amount from the ends of their hair (about a fingertip’s length). With this Umrah is complete and ihram ends.',
    textBn:
      'পুরুষেরা মাথা মুণ্ডন করেন বা চুল ছোট করেন; নারীরা চুলের আগা থেকে সামান্য (আঙুলের এক গিরা পরিমাণ) কাটেন। এর মাধ্যমে উমরা সম্পন্ন হয় এবং ইহরাম শেষ হয়।',
  },
];

export const HAJJ_KINDS: { id: string; en: string; bn: string; textEn: string; textBn: string }[] = [
  {
    id: 'tamattu',
    en: 'Tamattu‘',
    bn: 'তামাত্তু',
    textEn: 'Umrah first, leave ihram, then enter ihram for Hajj on 8 Dhul-Hijjah. A sacrifice is required.',
    textBn: 'প্রথমে উমরা করে ইহরাম খুলে ফেলা, তারপর ৮ জিলহজ হজের ইহরাম বাঁধা। কুরবানি (হাদি) দিতে হয়।',
  },
  {
    id: 'qiran',
    en: 'Qiran',
    bn: 'কিরান',
    textEn: 'Umrah and Hajj together in one ihram, which is kept until the rites of 10 Dhul-Hijjah. A sacrifice is required.',
    textBn: 'এক ইহরামেই উমরা ও হজ, যা ১০ জিলহজের কাজ পর্যন্ত রাখা হয়। কুরবানি (হাদি) দিতে হয়।',
  },
  {
    id: 'ifrad',
    en: 'Ifrad',
    bn: 'ইফরাদ',
    textEn: 'Hajj only, without Umrah.',
    textBn: 'শুধু হজ, উমরা ছাড়া।',
  },
];

export const HAJJ: Step[] = [
  {
    id: 'tarwiyah',
    en: '8 Dhul-Hijjah — to Mina',
    bn: '৮ জিলহজ — মিনায় যাত্রা',
    textEn:
      'Enter ihram for Hajj (if you are doing Tamattu‘, from where you stay in Makkah), say the Talbiyah, and go to Mina. Pray Dhuhr, Asr, Maghrib, Isha and Fajr there, each in its own time, shortening the four-rak‘ah prayers to two.',
    textBn:
      'হজের ইহরাম বাঁধুন (তামাত্তু হলে মক্কায় আপনার থাকার জায়গা থেকে), তালবিয়া পড়ুন এবং মিনায় যান। সেখানে জোহর, আসর, মাগরিব, এশা ও ফজর নিজ নিজ সময়ে পড়ুন, চার রাকাতের নামাজ দুই রাকাত করে।',
    duas: [115],
  },
  {
    id: 'arafah',
    en: '9 Dhul-Hijjah — Arafah',
    bn: '৯ জিলহজ — আরাফা',
    textEn:
      'After sunrise go to Arafah. Stay from noon until sunset making dua, remembering Allah and asking His forgiveness. This standing (wuquf) is the heart of Hajj, and Hajj is not valid without it. Dhuhr and Asr are prayed together, shortened, in the time of Dhuhr. Do not leave before sunset.',
    textBn:
      'সূর্যোদয়ের পর আরাফায় যান। দুপুর থেকে সূর্যাস্ত পর্যন্ত দোয়া, আল্লাহর স্মরণ ও ক্ষমা প্রার্থনায় কাটান। এই অবস্থান (উকুফ) হজের প্রাণ, এটি ছাড়া হজ হয় না। জোহর ও আসর একসঙ্গে, কসর করে, জোহরের সময়ে পড়া হয়। সূর্যাস্তের আগে বের হবেন না।',
    duas: [119],
  },
  {
    id: 'muzdalifah',
    en: 'Night of 10 — Muzdalifah',
    bn: '১০ তারিখের রাত — মুজদালিফা',
    textEn:
      'After sunset leave Arafah for Muzdalifah. Pray Maghrib and Isha together there and spend the night. Pray Fajr, remember Allah until it is bright, and collect small pebbles for the stoning.',
    textBn:
      'সূর্যাস্তের পর আরাফা থেকে মুজদালিফায় যান। সেখানে মাগরিব ও এশা একসঙ্গে পড়ে রাত কাটান। ফজর পড়ুন, ভোর ফর্সা না হওয়া পর্যন্ত আল্লাহর স্মরণ করুন এবং পাথর নিক্ষেপের জন্য ছোট ছোট কঙ্কর কুড়িয়ে নিন।',
    duas: [120],
  },
  {
    id: 'eid',
    en: '10 Dhul-Hijjah — Eid day',
    bn: '১০ জিলহজ — ঈদের দিন',
    textEn:
      'In Mina: stone Jamrat al-Aqabah (the largest pillar) with seven pebbles, saying Allahu Akbar with each; offer the sacrifice if it is required of you; then shave or trim the hair. Then go to Makkah for Tawaf al-Ifadah and, if you are doing Tamattu‘, the Sa‘i of Hajj. Your guide will explain the order of these rites and what may be flexible.',
    textBn:
      'মিনায়: সাতটি কঙ্কর দিয়ে জামরাতুল আকাবাকে (সবচেয়ে বড় স্তম্ভ) পাথর মারুন, প্রতিটির সঙ্গে আল্লাহু আকবার বলুন; আপনার ওপর কুরবানি ওয়াজিব হলে তা দিন; তারপর মাথা মুণ্ডন করুন বা চুল ছোট করুন। এরপর মক্কায় গিয়ে তাওয়াফে ইফাদা করুন এবং তামাত্তু হলে হজের সাঈ করুন। এসব কাজের ধারাবাহিকতা ও কোথায় ছাড় আছে তা আপনার গাইড বুঝিয়ে দেবেন।',
    duas: [121],
  },
  {
    id: 'tashreeq',
    en: '11 and 12 — days of Tashreeq',
    bn: '১১ ও ১২ জিলহজ — আইয়ামে তাশরিক',
    textEn:
      'Stay in Mina. Each day after noon, stone the three pillars in order — the small, the middle, then Jamrat al-Aqabah — with seven pebbles each, saying Allahu Akbar. You may leave Mina on the 12th before sunset, or stay for the 13th and stone again.',
    textBn:
      'মিনায় অবস্থান করুন। প্রতিদিন দুপুরের পর ক্রমান্বয়ে তিনটি স্তম্ভে পাথর মারুন — ছোট, মাঝারি, তারপর জামরাতুল আকাবা — প্রতিটিতে সাতটি কঙ্কর, আল্লাহু আকবার বলে। ১২ তারিখ সূর্যাস্তের আগে মিনা ছাড়তে পারেন, অথবা ১৩ তারিখ থেকে আবার পাথর মেরে যেতে পারেন।',
    duas: [121],
  },
  {
    id: 'wada',
    en: 'Farewell Tawaf',
    bn: 'বিদায়ী তাওয়াফ',
    textEn: 'Before leaving Makkah, perform Tawaf al-Wada‘, the farewell tawaf, as the last thing you do there.',
    textBn: 'মক্কা ছাড়ার আগে বিদায়ী তাওয়াফ (তাওয়াফুল ওয়াদা) করুন, মক্কায় এটিই আপনার শেষ কাজ হোক।',
    duas: [116],
  },
];

export const CHECKLIST: { id: string; en: string; bn: string }[] = [
  { id: 'passport', en: 'A valid passport', bn: 'মেয়াদ আছে এমন পাসপোর্ট' },
  { id: 'visa', en: 'Hajj or Umrah visa, permit and travel papers', bn: 'হজ বা উমরার ভিসা, অনুমতিপত্র ও ভ্রমণের কাগজপত্র' },
  { id: 'health', en: 'Vaccination or health certificates your agency asks for', bn: 'আপনার এজেন্সি যে টিকা বা স্বাস্থ্য সনদ চায় তা' },
  { id: 'ihram', en: 'Ihram clothing (men) and modest clothing (women)', bn: 'ইহরামের পোশাক (পুরুষ) ও শালীন পোশাক (নারী)' },
  { id: 'toiletries', en: 'Unscented soap and toiletries', bn: 'সুগন্ধিহীন সাবান ও প্রসাধনী' },
  { id: 'shoes', en: 'Comfortable footwear for long walks', bn: 'দীর্ঘ হাঁটার জন্য আরামদায়ক জুতা বা স্যান্ডেল' },
  { id: 'medicine', en: 'Your regular medicines, with a note from your doctor', bn: 'নিয়মিত ওষুধ, ডাক্তারের চিঠিসহ' },
  { id: 'copies', en: 'Copies of your documents and your group leader’s phone number', bn: 'কাগজপত্রের কপি ও দলনেতার ফোন নম্বর' },
  { id: 'pebbles', en: 'A small bag for the pebbles', bn: 'কঙ্কর রাখার ছোট থলি' },
  { id: 'power', en: 'Phone charger and a power bank', bn: 'ফোনের চার্জার ও পাওয়ার ব্যাংক' },
  { id: 'cash', en: 'Some cash in small notes', bn: 'কিছু খুচরা নগদ টাকা' },
  { id: 'learn', en: 'Learn the Talbiyah and practise the rites with your group guide', bn: 'তালবিয়া শিখুন এবং দলের গাইডের সঙ্গে হজের কাজগুলো অনুশীলন করুন' },
];
