import { router } from 'expo-router';
import { Glass } from '@/components/Glass';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { HADITH_BOOKS } from '@/data/hadithIndex';
import { useT } from '@/i18n';
import { dayKey } from '@/lib/dates';
import { HADITH_CREDIT } from '@/features/hadith/api';
import { hadithOfTheDay } from '@/features/hadith/daily';
import { useHadithSaved } from '@/features/hadith/store';
import { useSchedule } from '@/features/prayer/useSchedule';

export default function HadithHome() {
  const L = useT();
  const { schedule } = useSchedule(60_000);
  const today = hadithOfTheDay(dayKey(schedule.day));
  const savedCount = useHadithSaved((s) => Object.keys(s.saved).length);

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('hadith.title')} subtitle={L.t('hadith.subtitle')} />

      <Reveal index={0}>
        <Glass strong radius={28} padding={20} style={{ gap: 12 }}>
          <Txt variant="eyebrow" tone="muted">
            {L.t('hadith.today')}
          </Txt>
          <Txt variant="arabic" style={{ fontSize: 22, lineHeight: 44 }}>
            {today.ar}
          </Txt>
          <Txt variant="body" tone="soft" style={{ lineHeight: 26 }}>
            {L.lang === 'bn' ? today.bn : today.en}
          </Txt>
          <Txt variant="caption" tone="muted">
            {L.t('hadith.book.nawawi')} · {L.num(today.n)}
          </Txt>
        </Glass>
      </Reveal>

      <Reveal index={1}>
        <ListGroup title={L.t('hadith.books')}>
          {HADITH_BOOKS.map((b, i) => (
            <ListRow
              key={b.id}
              icon="scroll"
              title={L.lang === 'bn' ? L.t(`hadith.book.${b.id}` as never) : b.en}
              subtitle={L.lang === 'bn' ? b.ar : `${L.t('hadith.count', { n: L.num(b.sections[b.sections.length - 1].last) })}  ·  ${b.ar}`}
              onPress={() => router.push({ pathname: '/hadith/[book]', params: { book: b.id } })}
              last={i === HADITH_BOOKS.length - 1}
            />
          ))}
        </ListGroup>
      </Reveal>

      <Reveal index={2}>
        <ListGroup>
          <ListRow icon="bookmark" title={L.t('hadith.saved')} value={L.num(savedCount)} onPress={() => router.push('/hadith/saved')} last />
        </ListGroup>
      </Reveal>

      <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
        {L.t('hadith.footer')} {HADITH_CREDIT}
      </Txt>
    </Screen>
  );
}
