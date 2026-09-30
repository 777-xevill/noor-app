import { router, useLocalSearchParams } from 'expo-router';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { HADITH_BOOKS } from '@/data/hadithIndex';
import { useT } from '@/i18n';
import { bookTitle } from '@/features/hadith/HadithCard';

export default function BookScreen() {
  const L = useT();
  const { book } = useLocalSearchParams<{ book: string }>();
  const data = HADITH_BOOKS.find((b) => b.id === book) ?? HADITH_BOOKS[0];

  return (
    <Screen gap={16}>
      <ScreenHeader title={bookTitle(data.id, L.lang === 'bn' ? 'bn' : 'en', L.t as never)} subtitle={data.ar} />
      <ListGroup footer={L.t('hadith.sectionsFooter')}>
        {data.sections.map((s, i) => (
          <ListRow
            key={s.n}
            title={s.name}
            subtitle={L.t('hadith.range', { a: L.num(s.first), b: L.num(s.last) })}
            onPress={() => router.push({ pathname: '/hadith/[book]/[section]', params: { book: data.id, section: String(s.n) } })}
            last={i === data.sections.length - 1}
          />
        ))}
      </ListGroup>
    </Screen>
  );
}
