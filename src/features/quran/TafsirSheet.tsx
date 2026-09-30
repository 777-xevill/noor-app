import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Press } from '@/components/Press';
import { Sheet } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';
import { TAFSIRS, loadTafsir } from './tafsir';

/** The scholars' tafsir for one ayah, with the reader's language first. */
export function TafsirSheet({ surah, ayah, onClose }: { surah: number; ayah: number | null; onClose: () => void }) {
  const t = useTheme();
  const L = useT();
  const list = useMemo(() => [...TAFSIRS].sort((a, b) => Number(b.lang === L.lang) - Number(a.lang === L.lang)), [L.lang]);
  const [pick, setPick] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const tafsir = list.find((x) => x.id === pick) ?? list[0];
  const key = `${tafsir.id}-${surah}-${ayah}`;
  const [state, setState] = useState<{ key: string; text?: string; error?: boolean }>({ key: '' });

  useEffect(() => {
    if (ayah === null) return;
    let alive = true;
    loadTafsir(tafsir.id, surah, ayah).then(
      (text) => alive && setState({ key, text }),
      () => alive && setState({ key, error: true }),
    );
    return () => {
      alive = false;
    };
  }, [tafsir.id, surah, ayah, key, attempt]);

  const ready = state.key === key;

  return (
    <Sheet open={ayah !== null} onClose={onClose} title={`${L.t('reader.tafsir')} · ${L.num(`${surah}:${ayah ?? ''}`)}`}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {list.map((x) => (
          <Press key={x.id} onPress={() => setPick(x.id)} scaleTo={0.95} accessibilityRole="button" accessibilityState={{ selected: x.id === tafsir.id }}>
            <Chip variant={x.id === tafsir.id ? 'ink' : 'glass'} label={x.name} />
          </Press>
        ))}
      </ScrollView>
      <Glass radius={22} padding={16} style={{ gap: 10 }}>
        {!ready ? (
          <ActivityIndicator color={t.textMuted} />
        ) : state.error ? (
          <View style={{ gap: 10, alignItems: 'center' }}>
            <Txt variant="body" tone="muted" style={{ textAlign: 'center' }}>
              {L.t('reader.tafsirError')}
            </Txt>
            <Press
              onPress={() => {
                setState({ key: '' });
                setAttempt((a) => a + 1);
              }}
              accessibilityRole="button"
            >
              <Txt variant="bodyStrong">{L.t('hadith.retry')}</Txt>
            </Press>
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 360 }} nestedScrollEnabled>
            <Txt variant="body" tone="soft" style={{ lineHeight: 28 }}>
              {state.text}
            </Txt>
          </ScrollView>
        )}
        <Txt variant="micro" tone="muted">
          {tafsir.name} · {tafsir.author} · Quran.com
        </Txt>
      </Glass>
      <Txt variant="micro" tone="muted">
        {L.t('reader.tafsirNote')}
      </Txt>
    </Sheet>
  );
}
