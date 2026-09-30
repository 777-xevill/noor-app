import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Sheet } from '@/components/Sheet';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { SURAHS } from '@/data/surahs';
import { dayKey, fromDayKey } from '@/lib/dates';
import { useT } from '@/i18n';
import { useHifz } from '@/features/hifz/store';
import { type HifzItem, isDue } from '@/features/hifz/srs';
import { useSurah } from '@/features/quran/data';
import { localAyahUri } from '@/features/quran/offline';
import { ayahAudioUrl } from '@/features/quran/reciters';
import { useSchedule } from '@/features/prayer/useSchedule';
import { useSettings } from '@/features/settings/store';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

const MAX_AYAHS = 30;

function Button({ label, onPress, ink, icon }: { label: string; onPress: () => void; ink?: boolean; icon?: 'play' | 'pause' | 'eye' | 'eyeOff' }) {
  const t = useTheme();
  return (
    <Press onPress={onPress} scaleTo={0.97} accessibilityRole="button">
      <View style={{ height: 50, borderRadius: 25, backgroundColor: ink ? t.ink : t.pill, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
        {icon ? <Icon name={icon} size={17} color={ink ? t.onInk : t.text} /> : null}
        <Txt variant="title" tone={ink ? 'onInk' : undefined}>
          {label}
        </Txt>
      </View>
    </Press>
  );
}

/** One revision: recite from memory, then check against the text and say how it went. */
function Session({ item, today, onDone }: { item: HifzItem; today: string; onDone: () => void }) {
  const t = useTheme();
  const L = useT();
  const reciter = useSettings((s) => s.reciter);
  const record = useHifz((s) => s.review);
  const { data } = useSurah(item.surah);
  const [shown, setShown] = useState(false);
  const [hint, setHint] = useState(false);
  const [playing, setPlaying] = useState(false);
  const player = useAudioPlayer(null);
  const current = useRef<number | null>(null);
  const meta = SURAHS[item.surah - 1];
  const ayahs = (data?.ayahs ?? []).filter((a) => a.n >= item.from && a.n <= item.to);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const playFrom = useCallback(
    (ayah: number | null) => {
      current.current = ayah;
      setPlaying(ayah !== null);
      if (ayah === null) return player.pause();
      player.replace({ uri: localAyahUri(reciter, item.surah, ayah) ?? ayahAudioUrl(item.surah, ayah, reciter) });
      player.play();
    },
    [player, reciter, item.surah],
  );

  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (st) => {
      if (!st.didJustFinish || current.current === null) return;
      const next = current.current + 1;
      playFrom(next <= item.to ? next : null);
    });
    return () => sub.remove();
  }, [player, item.to, playFrom]);

  useEffect(() => () => player.pause(), [player]);

  const finish = (remembered: boolean) => {
    playFrom(null);
    record(item.id, remembered, today);
    onDone();
  };

  return (
    <Screen gap={16}>
      <ScreenHeader title={`${meta.name} ${L.num(`${item.from}–${item.to}`)}`} subtitle={L.t('hifz.recite')} />
      <Glass strong radius={28} padding={20} style={{ gap: 14 }}>
        {!shown ? (
          <>
            <Txt variant="body" tone="soft">
              {L.t('hifz.reciteHelp')}
            </Txt>
            {hint && ayahs[0] ? (
              <Txt variant="quran" style={{ fontSize: 30, lineHeight: 62 }}>
                {ayahs[0].ar.split(' ').slice(0, 2).join(' ')} …
              </Txt>
            ) : null}
          </>
        ) : (
          ayahs.map((a) => (
            <View key={a.n} style={{ gap: 6 }}>
              <Txt variant="quran" style={{ fontSize: 28, lineHeight: 60 }}>
                {a.ar}
              </Txt>
              <Txt variant="body" tone="soft">
                {L.lang === 'bn' ? a.bn : a.en}
              </Txt>
            </View>
          ))
        )}
      </Glass>
      {!shown ? (
        <View style={{ gap: 10 }}>
          {!hint && <Button label={L.t('hifz.hint')} onPress={() => setHint(true)} icon="eye" />}
          <Button label={L.t('hifz.listen')} onPress={() => playFrom(playing ? null : item.from)} icon={playing ? 'pause' : 'play'} />
          <Button label={L.t('hifz.check')} onPress={() => setShown(true)} ink icon="eye" />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            {L.t('hifz.how')}
          </Txt>
          <Button label={L.t('hifz.remembered')} onPress={() => finish(true)} ink />
          <Button label={L.t('hifz.again')} onPress={() => finish(false)} />
        </View>
      )}
      <Txt variant="micro" tone="muted" style={{ textAlign: 'center', color: t.textMuted }}>
        {L.t('hifz.session')}
      </Txt>
    </Screen>
  );
}

export default function HifzScreen() {
  const t = useTheme();
  const L = useT();
  const { schedule } = useSchedule(60_000);
  const today = dayKey(schedule.day);
  const items = useHifz((s) => s.items);
  const add = useHifz((s) => s.add);
  const remove = useHifz((s) => s.remove);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [surah, setSurah] = useState(1);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(7);
  const meta = SURAHS[surah - 1];

  const activeItem = items.find((i) => i.id === active);
  if (activeItem) return <Session item={activeItem} today={today} onDone={() => setActive(null)} />;

  const due = items.filter((i) => isDue(i, today));
  const later = items.filter((i) => !isDue(i, today)).sort((a, b) => a.due.localeCompare(b.due));
  const label = (i: HifzItem) => `${SURAHS[i.surah - 1].name} ${L.num(`${i.from}–${i.to}`)}`;

  const pickSurah = (n: number) => {
    setSurah(n);
    setFrom(1);
    setTo(Math.min(SURAHS[n - 1].ayahs, 5));
  };

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('hifz.title')} subtitle={L.t('hifz.subtitle')} />

      <Reveal index={0}>
        <Glass strong radius={28} padding={20} style={{ gap: 4 }}>
          <Txt tabular style={{ fontFamily: fonts.semibold, fontSize: 44, lineHeight: 52 }}>
            {L.num(due.length)}
          </Txt>
          <Txt variant="body" tone="soft">
            {L.t('hifz.dueToday')}
          </Txt>
        </Glass>
      </Reveal>

      {due.length > 0 && (
        <Reveal index={1}>
          <ListGroup title={L.t('hifz.reviseNow')}>
            {due.map((i, k) => (
              <ListRow key={i.id} icon="target" title={label(i)} subtitle={L.t('hifz.streakN', { n: L.num(i.reviews) })} onPress={() => setActive(i.id)} last={k === due.length - 1} />
            ))}
          </ListGroup>
        </Reveal>
      )}

      {later.length > 0 && (
        <Reveal index={2}>
          <ListGroup title={L.t('hifz.coming')}>
            {later.map((i, k) => (
              <ListRow
                key={i.id}
                title={label(i)}
                subtitle={L.t('hifz.next', { date: L.shortDate(fromDayKey(i.due)) })}
                right={
                  <Press onPress={() => remove(i.id)} accessibilityRole="button" accessibilityLabel={L.t('hifz.remove')} hitSlop={8}>
                    <Icon name="trash" size={17} color={t.textMuted} />
                  </Press>
                }
                last={k === later.length - 1}
              />
            ))}
          </ListGroup>
        </Reveal>
      )}

      {items.length === 0 && (
        <Txt variant="body" tone="muted" style={{ paddingHorizontal: 6 }}>
          {L.t('hifz.empty')}
        </Txt>
      )}

      <Button label={L.t('hifz.add')} onPress={() => setOpen(true)} ink icon={undefined} />
      <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
        {L.t('hifz.footer')}
      </Txt>

      <Sheet open={open} onClose={() => setOpen(false)} title={L.t('hifz.add')}>
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{meta.name}</Txt>
              <Txt variant="caption" tone="muted">
                {meta.meaning}
              </Txt>
            </View>
            <Stepper label={L.t('hifz.surah')} value={surah} min={1} max={114} format={(v) => L.num(v)} onChange={pickSurah} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt variant="body" tone="soft">
              {L.t('hifz.from')}
            </Txt>
            <Stepper
              label={L.t('hifz.from')}
              value={from}
              min={1}
              max={meta.ayahs}
              format={(v) => L.num(v)}
              onChange={(v) => {
                setFrom(v);
                if (to < v) setTo(v);
                if (to > v + MAX_AYAHS - 1) setTo(v + MAX_AYAHS - 1);
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt variant="body" tone="soft">
              {L.t('hifz.to')}
            </Txt>
            <Stepper label={L.t('hifz.to')} value={to} min={from} max={Math.min(meta.ayahs, from + MAX_AYAHS - 1)} format={(v) => L.num(v)} onChange={setTo} />
          </View>
          <Button
            label={L.t('hifz.addBtn')}
            ink
            onPress={() => {
              add(surah, from, to, today);
              setOpen(false);
            }}
          />
        </View>
      </Sheet>
    </Screen>
  );
}
