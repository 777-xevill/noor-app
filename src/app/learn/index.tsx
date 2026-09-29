import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { ProgressRing } from '@/components/ProgressRing';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { Txt } from '@/components/Txt';
import { SURAHS } from '@/data/surahs';
import { WBW } from '@/data/wbw';
import { fromDayKey } from '@/lib/dates';
import { useT } from '@/i18n';
import { type ArticleSummary, articlesEnabled, listArticles } from '@/features/learn/articles';
import { PASS, useLearn } from '@/features/learn/store';
import { useTheme } from '@/theme/useTheme';

function Articles() {
  const t = useTheme();
  const L = useT();
  const [state, setState] = useState<{ lang: string; items: ArticleSummary[] } | null>(null);

  useEffect(() => {
    let live = true;
    listArticles(L.lang)
      .then((items) => live && setState({ lang: L.lang, items }))
      .catch(() => live && setState({ lang: L.lang, items: [] }));
    return () => {
      live = false;
    };
  }, [L.lang]);

  const items = state?.lang === L.lang ? state.items : [];
  if (!items.length) return null;
  return (
    <View style={{ gap: 10 }}>
      <SectionHeader title={L.t('learn.articles')} />
      {items.map((a) => (
        <Press key={a.slug} onPress={() => router.push({ pathname: '/learn/article/[slug]', params: { slug: a.slug } })} scaleTo={0.985} accessibilityRole="button">
          <Glass radius={22} padding={16} style={{ gap: 6 }}>
            <Txt variant="title">{a.title}</Txt>
            {a.summary ? (
              <Txt variant="body" tone="soft" numberOfLines={3}>
                {a.summary}
              </Txt>
            ) : null}
            <Txt variant="caption" tone="muted">
              {L.t('learn.reviewedBy', { name: a.reviewed_by })} · {L.shortDate(fromDayKey(a.published_at.slice(0, 10)))}
            </Txt>
          </Glass>
        </Press>
      ))}
      <View style={{ height: 1, backgroundColor: t.line, marginTop: 4 }} />
    </View>
  );
}

export default function LearnScreen() {
  const t = useTheme();
  const L = useT();
  const best = useLearn((s) => s.best);
  const learned = WBW.filter((s) => (best[s.surah] ?? 0) >= PASS).length;

  return (
    <Screen gap={18}>
      <ScreenHeader title={L.t('learn.title')} subtitle={L.t('learn.subtitle')} />

      <Reveal index={0}>
        <Glass radius={28} padding={20} style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <ProgressRing size={52} stroke={4} progress={learned / WBW.length} color={t.ink} track={t.track} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="eyebrow" tone="muted">
                {L.t('learn.course')}
              </Txt>
              <Txt variant="h2">{L.t('learn.salahCourse')}</Txt>
            </View>
          </View>
          <Txt variant="body" tone="soft">
            {L.t('learn.salahCourseD')}
          </Txt>
          <Txt variant="caption" tone="muted" tabular>
            {L.t('learn.learnedOf', { n: learned, total: WBW.length })}
          </Txt>
        </Glass>
      </Reveal>

      <Reveal index={1}>
        <Glass radius={24} padding={0} style={{ paddingHorizontal: 14 }}>
          {WBW.map((s, i) => {
            const meta = SURAHS.find((m) => m.n === s.surah)!;
            const score = best[s.surah] ?? 0;
            const words = s.ayahs.reduce((n, a) => n + a.words.length, 0);
            return (
              <Press key={s.surah} onPress={() => router.push({ pathname: '/learn/[surah]', params: { surah: String(s.surah) } })} scaleTo={0.985} accessibilityRole="button">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: i < WBW.length - 1 ? 1 : 0, borderBottomColor: t.line }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: score >= PASS ? t.ink : t.pill, alignItems: 'center', justifyContent: 'center' }}>
                    {score >= PASS ? (
                      <Icon name="check" size={17} color={t.onInk} strokeWidth={2.4} />
                    ) : (
                      <Txt variant="caption" tabular>
                        {L.num(i + 1)}
                      </Txt>
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Txt variant="bodyStrong">{meta.name}</Txt>
                    <Txt variant="caption" tone="muted" tabular>
                      {meta.meaning} · {L.t('learn.words', { n: words })}
                      {score > 0 ? ` · ${L.t('learn.best', { n: Math.round(score * 100) })}` : ''}
                    </Txt>
                  </View>
                  <Icon name="chevronRight" size={16} color={t.textMuted} />
                </View>
              </Press>
            );
          })}
        </Glass>
      </Reveal>

      {articlesEnabled && <Articles />}

      <Txt variant="micro" tone="muted" style={{ textAlign: 'center' }}>
        {L.t('learn.source')}
      </Txt>
    </Screen>
  );
}
