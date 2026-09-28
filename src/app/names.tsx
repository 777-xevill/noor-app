import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Field } from '@/components/Field';
import { Glass } from '@/components/Glass';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { NAMES_99 } from '@/data/names';
import { QURAN_EXCERPTS } from '@/data/quranExcerpts';
import { useTheme } from '@/theme/useTheme';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export default function NamesScreen() {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = norm(query);
    return q ? NAMES_99.filter((n) => norm(n.tr).includes(q) || norm(n.en).includes(q) || String(n.n) === q) : NAMES_99;
  }, [query]);

  return (
    <Screen gap={16}>
      <ScreenHeader title="99 Names of Allah" subtitle="Al-Asma’ al-Husna" />
      <Glass strong radius={24} padding={16}>
        <Txt variant="quran" style={{ textAlign: 'center', fontSize: 24, lineHeight: 50 }}>
          {QURAN_EXCERPTS.names.ar}
        </Txt>
        <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          “{QURAN_EXCERPTS.names.en}” ({QURAN_EXCERPTS.names.ref})
        </Txt>
      </Glass>
      <Field icon="search" placeholder="Search by name or meaning" value={query} onChangeText={setQuery} autoCorrect={false} />
      <Glass radius={24} padding={0} style={{ paddingHorizontal: 14 }}>
        {list.map((n, i) => (
          <View key={n.n} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: i < list.length - 1 ? 1 : 0, borderBottomColor: t.line }}>
            <Txt variant="caption" tone="muted" tabular style={{ width: 26 }}>
              {n.n}
            </Txt>
            <View style={{ flex: 1 }}>
              <Txt variant="title">{n.tr}</Txt>
              <Txt variant="caption" tone="muted">
                {n.en}
              </Txt>
            </View>
            <Txt variant="arabic" style={{ fontSize: 22, lineHeight: 40 }}>
              {n.ar}
            </Txt>
          </View>
        ))}
      </Glass>
      <Txt variant="micro" tone="muted" style={{ textAlign: 'center' }}>
        Names and meanings from api.aladhan.com. Scholars differ slightly in how the list is compiled.
      </Txt>
    </Screen>
  );
}
