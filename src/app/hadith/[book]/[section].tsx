import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Press } from '@/components/Press';
import { Canvas } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { HADITH_BOOKS } from '@/data/hadithIndex';
import { useT } from '@/i18n';
import { GUTTER } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { HADITH_CREDIT, type HadithItem, loadSection } from '@/features/hadith/api';
import { HadithCard, bookTitle } from '@/features/hadith/HadithCard';

export default function SectionScreen() {
  const t = useTheme();
  const L = useT();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ book: string; section: string }>();
  const book = HADITH_BOOKS.find((b) => b.id === params.book) ?? HADITH_BOOKS[0];
  const sectionNo = Number(params.section) || 1;
  const section = book.sections.find((s) => s.n === sectionNo) ?? book.sections[0];
  const [state, setState] = useState<{ items: HadithItem[] | null; error: boolean; key: string }>({ items: null, error: false, key: '' });
  const [attempt, setAttempt] = useState(0);
  const key = `${book.id}/${section.n}`;

  // `attempt` is bumped by the retry button, to run the load again.
  const load = useCallback(() => {
    void attempt;
    let alive = true;
    loadSection(book.id, section.n).then(
      (items) => alive && setState({ items, error: false, key }),
      () => alive && setState({ items: null, error: true, key }),
    );
    return () => {
      alive = false;
    };
  }, [book.id, section.n, key, attempt]);
  useEffect(() => load(), [load]);

  const ready = state.key === key;
  const items = ready ? state.items : null;

  return (
    <View style={{ flex: 1, backgroundColor: t.canvas }}>
      <Canvas />
      <FlatList
        data={items ?? []}
        keyExtractor={(h) => String(h.n)}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: GUTTER, paddingBottom: 12 }}>
            <HadithCard book={book.id} item={item} />
          </View>
        )}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: GUTTER, paddingTop: insets.top + 12, paddingBottom: 16 }}>
            <ScreenHeader title={section.name} subtitle={bookTitle(book.id, L.lang === 'bn' ? 'bn' : 'en', L.t as never)} />
          </View>
        }
        ListEmptyComponent={
          ready && state.error ? (
            <View style={{ alignItems: 'center', gap: 12, padding: 32 }}>
              <Txt variant="body" tone="muted" style={{ textAlign: 'center' }}>
                {L.t('hadith.error')}
              </Txt>
              <Press onPress={() => {
                  setState({ items: null, error: false, key: '' });
                  setAttempt((a) => a + 1);
                }} accessibilityRole="button">
                <Txt variant="bodyStrong">{L.t('hadith.retry')}</Txt>
              </Press>
            </View>
          ) : (
            <ActivityIndicator color={t.textMuted} style={{ marginTop: 40 }} />
          )
        }
        ListFooterComponent={
          items ? (
            <Txt variant="micro" tone="muted" style={{ textAlign: 'center', padding: GUTTER, paddingBottom: insets.bottom + 40 }}>
              {HADITH_CREDIT}
            </Txt>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
