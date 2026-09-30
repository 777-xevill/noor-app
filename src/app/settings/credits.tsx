import { ListGroup, ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { ADHAN_CREDIT } from '@/features/prayer/adhan';

// [label key, source]. Sources are proper names and stay as published.
const SOURCES: [Key, string][] = [
  ['src.quranAr', 'Tanzil.net Uthmani text, via api.alquran.cloud'],
  ['src.quranEn', 'Saheeh International'],
  ['src.quranBn', 'Muhiuddin Khan'],
  ['src.recitation', 'everyayah.com (Alafasy, Husary, Minshawi, Abdul Basit, Sudais, Shuraim, Muaiqly, Shatri, Rifai)'],
  ['src.tafsirs', 'Quran.com: Ahsanul Bayaan, Abu Bakr Zakaria, Ibn Kathir (Tawheed Publication), Fathul Majid; Ibn Kathir (Abridged), Ma’arif al-Qur’an'],
  ['src.duas', 'Hisnul Muslim (Fortress of the Muslim), Sa’id ibn Ali ibn Wahf al-Qahtani, via hisnmuslim.com'],
  ['src.names', 'api.aladhan.com'],
  ['src.times', 'adhan (Batoul Apps), checked against api.aladhan.com'],
  ['src.cities', '© OpenStreetMap contributors'],
  ['src.adhan', ADHAN_CREDIT],
  ['src.hadith', 'Sahih Muslim — Arabic; English, Abdul Hamid Siddiqui; Bangla, Islamic Foundation; via fawazahmed0/hadith-api'],
  ['src.wbw', 'Quran.com (meanings, transliteration, word audio), checked against the Tanzil text'],
  ['src.tajweed', 'Quran.com word by word and tajweed markup, laid over the Tanzil text'],
  ['src.hadithLib', 'Hadith library: github.com/fawazahmed0/hadith-api (Arabic, English, Bangla); grades as given by the named scholars'],
  ['src.places', '© OpenStreetMap contributors, via the Overpass API'],
];

/** Where the app's religious text, audio and map data come from (their licences ask for credit). */
export default function CreditsScreen() {
  const L = useT();
  return (
    <Screen gap={20}>
      <ScreenHeader title={L.t('settings.credits')} />
      <ListGroup title={L.t('settings.sources')} footer={L.t('settings.sourcesFooter')}>
        {SOURCES.map(([what, from], i) => (
          <ListRow key={what} title={L.t(what)} subtitle={from} last={i === SOURCES.length - 1} />
        ))}
      </ListGroup>
    </Screen>
  );
}
