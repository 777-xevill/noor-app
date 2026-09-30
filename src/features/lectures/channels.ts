// Lectures are links to the speakers' own official YouTube channels; Noor hosts nothing. Each was checked
// to exist, but only the channel's owner controls what it publishes, so the screen says so. Add a channel
// only after looking at what it publishes. Bangla channels are still being chosen, so none are listed yet.
export type Channel = { id: string; name: string; lang: 'en' | 'bn'; about: string; aboutBn: string; url: string };

export const CHANNELS: Channel[] = [
  {
    id: 'yaqeen',
    name: 'Yaqeen Institute',
    lang: 'en',
    about: 'Research-based talks and short films on faith, doubt and modern questions.',
    aboutBn: 'বিশ্বাস, সংশয় ও আধুনিক প্রশ্ন নিয়ে গবেষণাভিত্তিক আলোচনা ও স্বল্পদৈর্ঘ্য ভিডিও (ইংরেজিতে)।',
    url: 'https://www.youtube.com/@yaqeeninstituteofficial',
  },
  {
    id: 'bayyinah',
    name: 'Bayyinah — Nouman Ali Khan',
    lang: 'en',
    about: 'Reflections on the Quran and its Arabic.',
    aboutBn: 'কুরআন ও তার আরবি ভাষা নিয়ে ভাবনা (ইংরেজিতে)।',
    url: 'https://www.youtube.com/@bayyinah',
  },
  {
    id: 'menk',
    name: 'Mufti Menk',
    lang: 'en',
    about: 'Talks on character, family and everyday life.',
    aboutBn: 'চরিত্র, পরিবার ও দৈনন্দিন জীবন নিয়ে আলোচনা (ইংরেজিতে)।',
    url: 'https://www.youtube.com/@MuftiMenkOfficial',
  },
];
