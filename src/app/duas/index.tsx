import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { Field } from '@/components/Field';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { Txt } from '@/components/Txt';
import { DUA_CHAPTERS } from '@/data/duaChapters';
import { DuaCard } from '@/features/duas/DuaCard';
import { FEATURED, useDuas, useSavedDuas } from '@/features/duas/data';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';

const open = (id: number) => router.push({ pathname: '/duas/[chapter]', params: { chapter: String(id) } });
const norm = (s: string) => s.toLowerCase();

export default function DuasScreen() {
  const t = useTheme();
  const L = useT();
  const [query, setQuery] = useState('');
  const { data } = useDuas();
  const saved = useSavedDuas((s) => s.saved);
  const q = norm(query.trim());

  // Search chapter titles and the English meaning of every dua.
  const matches = useMemo(() => {
    if (!q || !data) return null;
    const hits: { chapterId: number; chapterTitle: string; dua: (typeof data)[number]['duas'][number] }[] = [];
    for (const c of data) {
      const titleHit = norm(c.title).includes(q);
      for (const d of c.duas) if (titleHit || norm(d.en).includes(q) || norm(d.tr).includes(q)) hits.push({ chapterId: c.id, chapterTitle: c.title, dua: d });
    }
    return hits.slice(0, 40);
  }, [q, data]);

  const savedDuas = useMemo(() => {
    if (!data) return [];
    return saved
      .map((key) => {
        const [cid, did] = key.split(':').map(Number);
        const c = data.find((x) => x.id === cid);
        const d = c?.duas.find((x) => x.id === did);
        return c && d ? { chapterId: c.id, chapterTitle: c.title, dua: d } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [saved, data]);

  return (
    <Screen gap={18}>
      <ScreenHeader title={L.t('duas.title')} subtitle={L.t('duas.subtitle')} />
      {L.lang === 'bn' && (
        <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
          {L.t('duas.englishOnly')}
        </Txt>
      )}
      <Field icon="search" placeholder={L.t('duas.searchPh')} value={query} onChangeText={setQuery} autoCorrect={false} />

      {matches ? (
        <View style={{ gap: 12 }}>
          <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
            {matches.length ? L.t('duas.results', { n: `${L.num(matches.length)}${matches.length === 40 ? '+' : ''}` }) : L.t('duas.nothing', { q: query })}
          </Txt>
          {matches.map((m) => (
            <View key={`${m.chapterId}:${m.dua.id}`} style={{ gap: 6 }}>
              <Press onPress={() => open(m.chapterId)} style={{ paddingHorizontal: 6 }} accessibilityRole="button">
                <Txt variant="caption" tone="soft">
                  {m.chapterTitle} ›
                </Txt>
              </Press>
              <DuaCard chapterId={m.chapterId} chapterTitle={m.chapterTitle} dua={m.dua} />
            </View>
          ))}
        </View>
      ) : (
        <>
          <Reveal index={0}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {FEATURED.map((f) => {
                const info = DUA_CHAPTERS.find((c) => c.id === f.id);
                return (
                  <Press key={f.id} onPress={() => open(f.id)} scaleTo={0.95} style={{ width: '48%', flexGrow: 1 }} accessibilityRole="button" accessibilityLabel={L.t(f.label)}>
                    <Glass radius={22} padding={14} style={{ gap: 12, minHeight: 104 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={f.icon} size={19} color={t.onInk} />
                      </View>
                      <View>
                        <Txt variant="title">{L.t(f.label)}</Txt>
                        <Txt variant="caption" tone="muted">
                          {info ? (info.count === 1 ? L.t('duas.one') : L.t('duas.n', { n: info.count })) : ''}
                        </Txt>
                      </View>
                    </Glass>
                  </Press>
                );
              })}
            </View>
          </Reveal>

          {savedDuas.length > 0 && (
            <View style={{ gap: 12 }}>
              <SectionHeader title={L.t('duas.saved')} meta={savedDuas.length === 1 ? L.t('duas.one') : L.t('duas.n', { n: savedDuas.length })} />
              {savedDuas.map((m) => (
                <DuaCard key={`${m.chapterId}:${m.dua.id}`} chapterId={m.chapterId} chapterTitle={m.chapterTitle} dua={m.dua} />
              ))}
            </View>
          )}

          <Reveal index={1}>
            <View style={{ gap: 12 }}>
              <SectionHeader title={L.t('duas.allChapters')} meta={L.t('duas.chapters', { n: DUA_CHAPTERS.length })} />
              <Glass radius={24} padding={0} style={{ paddingHorizontal: 14 }}>
                {DUA_CHAPTERS.map((c, i) => (
                  <Press key={c.id} onPress={() => open(c.id)} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={c.title}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: i < DUA_CHAPTERS.length - 1 ? 1 : 0, borderBottomColor: t.line }}>
                      <Txt variant="caption" tone="muted" tabular style={{ width: 28 }}>
                        {L.num(c.id)}
                      </Txt>
                      <Txt variant="bodyStrong" style={{ flex: 1 }}>
                        {c.title}
                      </Txt>
                      <Txt variant="caption" tone="muted" tabular>
                        {L.num(c.count)}
                      </Txt>
                      <Icon name="chevronRight" size={16} color={t.textMuted} />
                    </View>
                  </Press>
                ))}
              </Glass>
              {!data && <ActivityIndicator color={t.textMuted} />}
            </View>
          </Reveal>
        </>
      )}
    </Screen>
  );
}
