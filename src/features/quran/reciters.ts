// Verse-by-verse recitations from everyayah.com. The folder id names the reciter and bitrate; each was
// checked to serve audio for the first ayah of Al-Fatiha.
export type Reciter = { id: string; name: string; nameBn: string; style?: 'murattal' | 'mujawwad' | 'muallim' };

export const DEFAULT_RECITER = 'Alafasy_128kbps';

export const RECITERS: Reciter[] = [
  { id: 'Alafasy_128kbps', name: 'Mishary Rashid Alafasy', nameBn: 'মিশারি রাশিদ আলাফাসি' },
  { id: 'Husary_128kbps', name: 'Mahmoud Khalil Al-Husary', nameBn: 'মাহমুদ খলিল আল-হুসারি', style: 'murattal' },
  { id: 'Husary_Muallim_128kbps', name: 'Mahmoud Khalil Al-Husary (teaching)', nameBn: 'মাহমুদ খলিল আল-হুসারি (শিক্ষামূলক)', style: 'muallim' },
  { id: 'Minshawy_Murattal_128kbps', name: 'Mohamed Siddiq Al-Minshawi', nameBn: 'মুহাম্মদ সিদ্দিক আল-মিনশাবি', style: 'murattal' },
  { id: 'Minshawy_Mujawwad_192kbps', name: 'Mohamed Siddiq Al-Minshawi (mujawwad)', nameBn: 'মুহাম্মদ সিদ্দিক আল-মিনশাবি (মুজাওয়াদ)', style: 'mujawwad' },
  { id: 'Abdul_Basit_Murattal_192kbps', name: 'Abdul Basit Abdus-Samad', nameBn: 'আবদুল বাসিত আবদুস সামাদ', style: 'murattal' },
  { id: 'Abdul_Basit_Mujawwad_128kbps', name: 'Abdul Basit Abdus-Samad (mujawwad)', nameBn: 'আবদুল বাসিত আবদুস সামাদ (মুজাওয়াদ)', style: 'mujawwad' },
  { id: 'Abdurrahmaan_As-Sudais_192kbps', name: 'Abdur-Rahman As-Sudais', nameBn: 'আবদুর রহমান আস-সুদাইস' },
  { id: 'Saood_ash-Shuraym_128kbps', name: 'Saud Ash-Shuraim', nameBn: 'সাউদ আশ-শুরাইম' },
  { id: 'MaherAlMuaiqly128kbps', name: 'Maher Al-Muaiqly', nameBn: 'মাহির আল-মুআইকিলি' },
  { id: 'Abu_Bakr_Ash-Shaatree_128kbps', name: 'Abu Bakr Ash-Shatri', nameBn: 'আবু বকর আশ-শাত্রি' },
  { id: 'Hani_Rifai_192kbps', name: 'Hani Ar-Rifai', nameBn: 'হানি আর-রিফাঈ' },
];

export const reciterById = (id: string) => RECITERS.find((r) => r.id === id) ?? RECITERS[0];

const pad = (n: number) => String(n).padStart(3, '0');

/** Everyayah file name for an ayah, e.g. 002255 for Ayat al-Kursi. */
export const ayahFile = (surah: number, ayah: number) => `${pad(surah)}${pad(ayah)}.mp3`;

export const ayahAudioUrl = (surah: number, ayah: number, reciter: string = DEFAULT_RECITER) =>
  `https://everyayah.com/data/${reciter}/${ayahFile(surah, ayah)}`;
