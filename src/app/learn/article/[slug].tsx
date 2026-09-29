import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Glass } from '@/components/Glass';
import { Press } from '@/components/Press';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import { type Article, getArticle } from '@/features/learn/articles';
import { useTheme } from '@/theme/useTheme';

/** The article body format: blank-line paragraphs, "## " headings, "- " list items, "> " quotations. */
function Prose({ text }: { text: string }) {
  const t = useTheme();
  const blocks = text.replace(/\r/g, '').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <View style={{ gap: 14 }}>
      {blocks.map((b, i) => {
        if (b.startsWith('## ')) return <Txt key={i} variant="h2">{b.slice(3)}</Txt>;
        if (b.startsWith('> '))
          return (
            <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: t.lineStrong, paddingLeft: 14 }}>
              <Txt variant="body" tone="soft" style={{ fontSize: 16, lineHeight: 25 }}>
                {b.replace(/^> ?/gm, '')}
              </Txt>
            </View>
          );
        if (b.startsWith('- '))
          return (
            <View key={i} style={{ gap: 6 }}>
              {b.split('\n').map((line, j) => (
                <View key={j} style={{ flexDirection: 'row', gap: 10 }}>
                  <Txt variant="body" tone="muted">
                    •
                  </Txt>
                  <Txt variant="body" style={{ flex: 1, fontSize: 16, lineHeight: 25 }}>
                    {line.replace(/^- /, '')}
                  </Txt>
                </View>
              ))}
            </View>
          );
        return (
          <Txt key={i} variant="body" style={{ fontSize: 16, lineHeight: 25 }}>
            {b}
          </Txt>
        );
      })}
    </View>
  );
}

export default function ArticleScreen() {
  const L = useT();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [state, setState] = useState<{ key: string; article: Article | null } | null>(null);
  const key = `${slug}|${L.lang}`;

  useEffect(() => {
    let live = true;
    getArticle(slug, L.lang)
      .then((article) => live && setState({ key, article }))
      .catch(() => live && setState({ key, article: null }));
    return () => {
      live = false;
    };
  }, [slug, L.lang, key]);

  const a = state?.key === key ? state.article : undefined;

  return (
    <Screen gap={18}>
      <ScreenHeader title={a?.title ?? L.t('learn.articles')} />
      {a === undefined ? (
        <ActivityIndicator />
      ) : a === null ? (
        <Txt variant="body" tone="muted">
          {L.t('learn.articleMissing')}
        </Txt>
      ) : (
        <>
          <Txt variant="caption" tone="muted">
            {L.t('learn.byline', { author: a.author, reviewer: a.reviewed_by })}
          </Txt>
          <Prose text={a.body} />
          {a.sources.length > 0 && (
            <Glass radius={22} padding={16} style={{ gap: 8 }}>
              <Txt variant="eyebrow" tone="muted">
                {L.t('learn.sources')}
              </Txt>
              {a.sources.map((s) =>
                s.url ? (
                  <Press key={s.title} onPress={() => Linking.openURL(s.url!)} accessibilityRole="link">
                    <Txt variant="body" tone="soft" style={{ textDecorationLine: 'underline' }}>
                      {s.title}
                    </Txt>
                  </Press>
                ) : (
                  <Txt key={s.title} variant="body" tone="soft">
                    {s.title}
                  </Txt>
                ),
              )}
            </Glass>
          )}
        </>
      )}
    </Screen>
  );
}
