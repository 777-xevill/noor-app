import { useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Press } from '@/components/Press';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { SURAHS } from '@/data/surahs';
import { useT } from '@/i18n';
import { deleteSurahAudio, downloadSurah, offlineSupported, useOfflineAudio } from '@/features/quran/offline';
import { RECITERS, reciterById } from '@/features/quran/reciters';
import { useSettings } from '@/features/settings/store';
import { useTheme } from '@/theme/useTheme';

export default function RecitationScreen() {
  const t = useTheme();
  const L = useT();
  const reciter = useSettings((s) => s.reciter);
  const set = useSettings((s) => s.set);
  const done = useOfflineAudio((s) => s.done);
  const mark = useOfflineAudio((s) => s.mark);
  const unmark = useOfflineAudio((s) => s.unmark);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const cancelled = useRef<Set<number>>(new Set());
  const current = reciterById(reciter);

  const start = async (surah: number, ayahs: number) => {
    cancelled.current.delete(surah);
    setProgress((p) => ({ ...p, [surah]: 0 }));
    let ok = false;
    try {
      ok = await downloadSurah(reciter, surah, ayahs, (n) => setProgress((p) => ({ ...p, [surah]: n })), () => cancelled.current.has(surah));
    } catch {
      ok = false;
    }
    setProgress((p) => {
      const next = { ...p };
      delete next[surah];
      return next;
    });
    if (ok) mark(reciter, surah);
  };

  return (
    <Screen gap={20}>
      <ScreenHeader title={L.t('rec.title')} subtitle={L.lang === 'bn' ? current.nameBn : current.name} />

      <ListGroup title={L.t('rec.reciter')} footer={L.t('rec.reciterFooter')}>
        {RECITERS.map((r, i) => (
          <ListRow
            key={r.id}
            title={L.lang === 'bn' ? r.nameBn : r.name}
            subtitle={r.style ? L.t(`rec.style.${r.style}`) : undefined}
            onPress={() => set({ reciter: r.id })}
            right={r.id === reciter ? <Icon name="check" size={18} color={t.text} strokeWidth={2.4} /> : <View style={{ width: 18 }} />}
            last={i === RECITERS.length - 1}
          />
        ))}
      </ListGroup>

      {offlineSupported && Platform.OS !== 'web' ? (
        <ListGroup title={L.t('rec.offline')} footer={L.t('rec.offlineFooter')}>
          {SURAHS.map((s, i) => {
            const n = i + 1;
            const saved = !!done[`${reciter}/${n}`];
            const busy = progress[n] !== undefined;
            return (
              <ListRow
                key={n}
                title={`${L.num(n)}. ${s.name}`}
                subtitle={L.t('rec.ayahs', { n: L.num(s.ayahs) })}
                right={
                  busy ? (
                    <Press onPress={() => cancelled.current.add(n)} accessibilityRole="button" accessibilityLabel={L.t('rec.cancel')} hitSlop={8}>
                      <Txt variant="caption" tone="soft" tabular>
                        {L.num(progress[n])}/{L.num(s.ayahs)} ✕
                      </Txt>
                    </Press>
                  ) : saved ? (
                    <Press
                      onPress={() => {
                        deleteSurahAudio(reciter, n);
                        unmark(reciter, n);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={L.t('rec.remove')}
                      hitSlop={8}
                    >
                      <Icon name="trash" size={18} color={t.textMuted} />
                    </Press>
                  ) : (
                    <Press onPress={() => start(n, s.ayahs)} accessibilityRole="button" accessibilityLabel={L.t('rec.download')} hitSlop={8}>
                      <Icon name="download" size={18} color={t.text} />
                    </Press>
                  )
                }
                last={i === SURAHS.length - 1}
              />
            );
          })}
        </ListGroup>
      ) : (
        <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
          {L.t('rec.webNote')}
        </Txt>
      )}
    </Screen>
  );
}
