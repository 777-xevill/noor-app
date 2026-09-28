import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { DUA_CHAPTERS } from '@/data/duaChapters';
import { DuaCard } from '@/features/duas/DuaCard';
import { useDuas } from '@/features/duas/data';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';

export default function DuaChapterScreen() {
  const t = useTheme();
  const L = useT();
  const { chapter } = useLocalSearchParams<{ chapter: string }>();
  const id = Number(chapter);
  const info = DUA_CHAPTERS.find((c) => c.id === id);
  const { data, error } = useDuas();
  const c = data?.find((x) => x.id === id);

  return (
    <Screen gap={14}>
      <ScreenHeader title={info?.title ?? L.t('duas.title')} subtitle={L.t('duas.chapterN', { n: id })} />
      {error ? (
        <Txt variant="body" tone="muted">
          {L.t('duas.cantLoad')} {error.message}
        </Txt>
      ) : !c ? (
        <ActivityIndicator color={t.textMuted} style={{ marginTop: 30 }} />
      ) : (
        <View style={{ gap: 12 }}>
          {c.duas.map((d, i) => (
            <Reveal key={d.id} index={Math.min(i, 6)}>
              <DuaCard chapterId={c.id} chapterTitle={c.title} dua={d} />
            </Reveal>
          ))}
          <Txt variant="micro" tone="muted" style={{ textAlign: 'center', marginTop: 6 }}>
            {L.t('duas.footer')}
          </Txt>
        </View>
      )}
    </Screen>
  );
}
