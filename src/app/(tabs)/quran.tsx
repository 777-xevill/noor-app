import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Field } from '@/components/Field';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { ProgressRing } from '@/components/ProgressRing';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { JUZ_STARTS } from '@/data/juz';
import { SURAHS, type SurahMeta } from '@/data/surahs';
import { dayKey } from '@/lib/dates';
import { ContinueReading } from '@/features/home/ContinueReading';
import { useSchedule } from '@/features/prayer/useSchedule';
import { useQuranProgress } from '@/features/quran/progress';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';

type View_ = 'surah' | 'juz' | 'saved';

const openReader = (surah: number, ayah?: number) =>
  router.push({ pathname: '/quran/[surah]', params: ayah ? { surah: String(surah), ayah: String(ayah) } : { surah: String(surah) } });

// Match "baqara", "al baqarah", "2", "cow" — forgiving of spelling and punctuation.
const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function NumberBadge({ n }: { n: number }) {
  const t = useTheme();
  const L = useT();
  return (
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: t.lineStrong,
        transform: [{ rotate: '45deg' }],
      }}
    >
      <View style={{ transform: [{ rotate: '-45deg' }] }}>
        <Txt variant="caption" tabular>
          {L.num(n)}
        </Txt>
      </View>
    </View>
  );
}

function SurahRow({ s }: { s: SurahMeta }) {
  const t = useTheme();
  const L = useT();
  return (
    <Press onPress={() => openReader(s.n)} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={L.t('quran.surahA11y', { name: s.name })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.line }}>
        <NumberBadge n={s.n} />
        <View style={{ flex: 1 }}>
          <Txt variant="title">{s.name}</Txt>
          <Txt variant="caption" tone="muted">
            {s.meaning} · {L.t('quran.ayahs', { n: s.ayahs })} · {L.t(s.type === 'Meccan' ? 'quran.makki' : 'quran.madani')}
          </Txt>
        </View>
        <Txt variant="arabic" style={{ fontSize: 21, lineHeight: 34 }}>
          {s.ar.replace(/^سُورَةُ\s*/, '')}
        </Txt>
      </View>
    </Press>
  );
}

function TodayReading() {
  const t = useTheme();
  const L = useT();
  const { schedule } = useSchedule(60_000);
  const seconds = useQuranProgress((s) => s.readingSeconds[dayKey(schedule.day)] ?? 0);
  const goal = useQuranProgress((s) => s.goalMinutes);
  const minutes = Math.floor(seconds / 60);
  return (
    <Glass radius={24} padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <ProgressRing size={46} stroke={4} progress={minutes / goal} color={t.ink} track={t.track} />
      <View style={{ flex: 1 }}>
        <Txt variant="title" tabular>
          {L.t('quran.minToday', { m: minutes, g: goal })}
        </Txt>
        <Txt variant="caption" tone="muted">
          {L.t(minutes >= goal ? 'quran.goalReached' : 'quran.goalHint')}
        </Txt>
      </View>
    </Glass>
  );
}

export default function QuranScreen() {
  const t = useTheme();
  const L = useT();
  const [view, setView] = useState<View_>('surah');
  const [query, setQuery] = useState('');
  const bookmarks = useQuranProgress((s) => s.bookmarks);

  const surahs = useMemo(() => {
    const q = normalise(query);
    if (!q) return SURAHS;
    return SURAHS.filter((s) => String(s.n) === q || normalise(s.name).includes(q) || normalise(s.meaning).includes(q));
  }, [query]);

  return (
    <Screen tabs gap={18}>
      <Reveal index={0}>
        <Txt variant="h1" style={{ marginTop: 8 }}>
          {L.t('quran.title')}
        </Txt>
      </Reveal>
      <Reveal index={1}>
        <ContinueReading />
      </Reveal>
      <Reveal index={2}>
        <TodayReading />
      </Reveal>
      <Reveal index={3}>
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'surah', label: L.t('quran.surah') },
            { value: 'juz', label: L.t('quran.juz') },
            { value: 'saved', label: `${L.t('quran.saved')}${bookmarks.length ? ` · ${L.num(bookmarks.length)}` : ''}` },
          ]}
        />
      </Reveal>

      {view === 'surah' && (
        <Reveal index={4}>
          <View style={{ gap: 8 }}>
            <Field icon="search" placeholder={L.t('quran.searchPh')} value={query} onChangeText={setQuery} autoCorrect={false} />
            <Glass radius={24} padding={0} style={{ paddingHorizontal: 14 }}>
              {surahs.map((s) => (
                <SurahRow key={s.n} s={s} />
              ))}
              {surahs.length === 0 && (
                <Txt variant="body" tone="muted" style={{ paddingVertical: 24, textAlign: 'center' }}>
                  {L.t('quran.noMatch', { q: query })}
                </Txt>
              )}
            </Glass>
          </View>
        </Reveal>
      )}

      {view === 'juz' && (
        <Glass radius={24} padding={0} style={{ paddingHorizontal: 14 }}>
          {JUZ_STARTS.map((j) => {
            const s = SURAHS[j.surah - 1];
            return (
              <Press key={j.juz} onPress={() => openReader(j.surah, j.ayah)} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={L.t('quran.juzN', { n: j.juz })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: t.line }}>
                  <NumberBadge n={j.juz} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="title">{L.t('quran.juzN', { n: j.juz })}</Txt>
                    <Txt variant="caption" tone="muted">
                      {L.t('quran.startsAt', { name: s.name, ref: L.num(`${j.surah}:${j.ayah}`) })}
                    </Txt>
                  </View>
                  <Icon name="chevronRight" size={17} color={t.textMuted} />
                </View>
              </Press>
            );
          })}
        </Glass>
      )}

      {view === 'saved' && (
        <Glass radius={24} padding={bookmarks.length ? 0 : 24} style={{ paddingHorizontal: 14 }}>
          {bookmarks.length === 0 ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
              <Icon name="bookmark" size={26} color={t.textMuted} />
              <Txt variant="title">{L.t('quran.noSaved')}</Txt>
              <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
                {L.t('quran.noSavedHint')}
              </Txt>
            </View>
          ) : (
            [...bookmarks].reverse().map((key) => {
              const [sn, an] = key.split(':').map(Number);
              const s = SURAHS[sn - 1];
              return (
                <Press key={key} onPress={() => openReader(sn, an)} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={`${s.name} ${key}`}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: t.line }}>
                    <Icon name="bookmark" size={18} color={t.text} fill={t.text} />
                    <View style={{ flex: 1 }}>
                      <Txt variant="title">{s.name}</Txt>
                      <Txt variant="caption" tone="muted">
                        {L.t('quran.ayahN', { n: an })} · {s.meaning}
                      </Txt>
                    </View>
                    <Icon name="chevronRight" size={17} color={t.textMuted} />
                  </View>
                </Press>
              );
            })
          )}
        </Glass>
      )}
    </Screen>
  );
}
