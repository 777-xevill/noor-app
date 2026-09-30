import { Platform, Share, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Txt } from '@/components/Txt';
import { HADITH_BOOKS } from '@/data/hadithIndex';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';
import type { HadithItem } from './api';
import { hadithId, useHadithSaved } from './store';

export function bookTitle(book: string, lang: 'en' | 'bn', tr: (k: never) => string) {
  const b = HADITH_BOOKS.find((x) => x.id === book);
  return lang === 'bn' ? tr(`hadith.book.${book}` as never) : (b?.en ?? book);
}

/** One hadith: Arabic, then the reader's language first, with its grades and save/share actions. */
export function HadithCard({ book, item }: { book: string; item: HadithItem }) {
  const t = useTheme();
  const L = useT();
  const saved = useHadithSaved((s) => !!s.saved[hadithId(book, item.n)]);
  const toggle = useHadithSaved((s) => s.toggle);
  const title = bookTitle(book, L.lang === 'bn' ? 'bn' : 'en', L.t as never);
  const first = L.lang === 'bn' ? item.bn : item.en;
  const second = L.lang === 'bn' ? item.en : item.bn;

  return (
    <Glass radius={24} padding={16} style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: t.pill, justifyContent: 'center' }}>
          <Txt variant="micro" tone="soft" tabular>
            {L.num(item.n)}
          </Txt>
        </View>
        <View style={{ flex: 1 }} />
        <Press
          hitSlop={10}
          scaleTo={0.82}
          accessibilityRole="button"
          accessibilityLabel={L.t(saved ? 'reader.unbookmark' : 'reader.bookmark')}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggle({ book, n: item.n, ar: item.ar, en: item.en, bn: item.bn });
          }}
        >
          <Icon name="bookmark" size={18} color={t.text} fill={saved ? t.text : 'none'} />
        </Press>
        <Press
          hitSlop={10}
          scaleTo={0.82}
          accessibilityRole="button"
          accessibilityLabel={L.t('reader.share')}
          style={{ marginLeft: 14 }}
          onPress={() => Share.share({ message: `${item.ar ?? ''}\n\n${first ?? second ?? ''}\n\n— ${title} ${item.n}` }).catch(() => {})}
        >
          <Icon name="share" size={18} color={t.text} />
        </Press>
      </View>
      {item.ar ? (
        <Txt variant="arabic" style={{ fontSize: 22, lineHeight: 44 }}>
          {item.ar}
        </Txt>
      ) : null}
      {first ? (
        <Txt variant="body" tone="soft" style={{ lineHeight: 26 }}>
          {first}
        </Txt>
      ) : null}
      {second ? (
        <Txt variant="body" tone="muted" style={{ lineHeight: 26 }}>
          {second}
        </Txt>
      ) : null}
      {item.grades?.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {item.grades.map((g) => (
            <Chip key={g.name} variant="glass" label={`${g.name}: ${g.grade}`} />
          ))}
        </View>
      ) : null}
      <Txt variant="micro" tone="muted">
        {title} · {L.num(item.n)}
      </Txt>
    </Glass>
  );
}
