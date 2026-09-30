import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, Platform, Share, Text, View, type ViewToken } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Press } from '@/components/Press';
import { Canvas } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { Toggle } from '@/components/Toggle';
import { Txt } from '@/components/Txt';
import { BASMALA } from '@/data/basmala';
import { SURAHS } from '@/data/surahs';
import { dayKey, wallDay } from '@/lib/dates';
import { type Ayah, type WordSurah, surahMeta, useSurah, useSurahWords } from '@/features/quran/data';
import { localAyahUri } from '@/features/quran/offline';
import { useQuranProgress } from '@/features/quran/progress';
import { ayahAudioUrl, reciterById } from '@/features/quran/reciters';
import { GROUPS, type TajweedGroup, parseTajweed } from '@/features/quran/tajweed';
import { TafsirSheet } from '@/features/quran/TafsirSheet';
import { type ReaderView, useSettings } from '@/features/settings/store';
import { fonts } from '@/theme/fonts';
import { GUTTER } from '@/theme/tokens';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toArabicDigits = (n: number) => String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);

/** Counts reading time (15 s steps) while the reader is open and the app is in the foreground. */
function useReadingTimer() {
  const addReading = useQuranProgress((s) => s.addReading);
  const tz = useSettings((s) => s.location.timeZone);
  useEffect(() => {
    const STEP = 15;
    const id = setInterval(() => {
      if (AppState.currentState === 'active') addReading(dayKey(wallDay(new Date(), tz)), STEP);
    }, STEP * 1000);
    return () => clearInterval(id);
  }, [addReading, tz]);
}

type WordAyah = WordSurah['a'][number];

/** The ayah's Arabic with tajweed rules drawn as marks: grey = not pronounced, underline = nasal sounds,
 *  highlight = elongation, both = qalqalah. Monochrome to match the app. */
function TajweedText({ marked, size, number }: { marked: string; size: number; number: number }) {
  const t = useTheme();
  const style = (g?: TajweedGroup) =>
    g === 'silent'
      ? { color: t.textMuted }
      : g === 'nasal'
        ? { textDecorationLine: 'underline' as const }
        : g === 'madd'
          ? { backgroundColor: t.pill }
          : g === 'qalqalah'
            ? { textDecorationLine: 'underline' as const, backgroundColor: t.pill }
            : undefined;
  return (
    <Txt variant="quran" style={{ fontSize: size, lineHeight: Math.round(size * 2.1) }}>
      {parseTajweed(marked).map((seg, i) => (
        <Text key={i} style={style(seg.group)}>
          {seg.text}
        </Text>
      ))}{' '}
      <Txt style={{ fontFamily: fonts.quran, fontSize: size * 0.9 }}>{'۝' + toArabicDigits(number)}</Txt>
    </Txt>
  );
}

/** Each word with its transliteration and meaning beneath it, read right to left. */
function WordGrid({ words, lang }: { words: WordAyah['w']; lang: 'bn' | 'en' }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' }}>
      {words.map(([ar, tr, en, bn], i) => (
        <View key={i} style={{ alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 14, backgroundColor: t.pill, maxWidth: 130 }}>
          <Txt variant="quran" style={{ fontSize: 26, lineHeight: 58, paddingBottom: 4 }}>
            {ar}
          </Txt>
          <Txt variant="micro" tone="muted" style={{ fontStyle: 'italic', textAlign: 'center' }}>
            {tr}
          </Txt>
          <Txt variant="caption" tone="soft" style={{ textAlign: 'center' }}>
            {lang === 'bn' ? bn : en}
          </Txt>
        </View>
      ))}
    </View>
  );
}

function AyahRow({
  surah,
  ayah,
  playing,
  onPlay,
  view,
  words,
  onTafsir,
}: {
  surah: number;
  ayah: Ayah;
  playing: boolean;
  onPlay: () => void;
  view: ReaderView;
  words?: WordAyah;
  onTafsir: () => void;
}) {
  const t = useTheme();
  const L = useT();
  const q = useSettings((s) => s.quran);
  const key = `${surah}:${ayah.n}`;
  const saved = useQuranProgress((s) => s.bookmarks.includes(key));
  const toggleBookmark = useQuranProgress((s) => s.toggleBookmark);
  const meta = SURAHS[surah - 1];

  return (
    <View
      style={{
        marginHorizontal: GUTTER,
        paddingVertical: 18,
        paddingHorizontal: 14,
        gap: 12,
        borderRadius: 22,
        backgroundColor: playing ? t.glassStrong : 'transparent',
        borderWidth: 1,
        borderColor: playing ? t.glassBorder : 'transparent',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: t.pill, justifyContent: 'center' }}>
          <Txt variant="micro" tone="soft" tabular>
            {L.num(key)}
          </Txt>
        </View>
        {ayah.sajda && <Chip variant="ink" label={L.t('reader.sajdah')} />}
        <View style={{ flex: 1 }} />
        <Press hitSlop={10} scaleTo={0.82} accessibilityRole="button" accessibilityLabel={playing ? L.t('reader.stop') : L.t('reader.play', { n: ayah.n })} onPress={onPlay}>
          <Icon name={playing ? 'pause' : 'play'} size={18} color={t.text} />
        </Press>
        <Press hitSlop={10} scaleTo={0.82} accessibilityRole="button" accessibilityLabel={L.t('reader.tafsir')} onPress={onTafsir} style={{ marginLeft: 14 }}>
          <Icon name="library" size={18} color={t.text} />
        </Press>
        <Press
          hitSlop={10}
          scaleTo={0.82}
          accessibilityRole="button"
          accessibilityLabel={L.t(saved ? 'reader.unbookmark' : 'reader.bookmark')}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleBookmark(key);
          }}
          style={{ marginLeft: 14 }}
        >
          <Icon name="bookmark" size={18} color={t.text} fill={saved ? t.text : 'none'} />
        </Press>
        <Press
          hitSlop={10}
          scaleTo={0.82}
          accessibilityRole="button"
          accessibilityLabel={L.t('reader.share')}
          style={{ marginLeft: 14 }}
          onPress={() =>
            Share.share({ message: `${ayah.ar}\n\n${ayah.en}\n\n— ${meta.name} ${key}` }).catch(() => {})
          }
        >
          <Icon name="share" size={18} color={t.text} />
        </Press>
      </View>

      {view === 'tajweed' && words ? (
        <TajweedText marked={words.t} size={q.arabicSize} number={ayah.n} />
      ) : view === 'words' && words ? (
        <WordGrid words={words.w} lang={L.lang === 'bn' ? 'bn' : 'en'} />
      ) : (
        <Txt variant="quran" style={{ fontSize: q.arabicSize, lineHeight: Math.round(q.arabicSize * 2.1) }}>
          {ayah.ar} <Txt style={{ fontFamily: fonts.quran, fontSize: q.arabicSize * 0.9 }}>{'۝' + toArabicDigits(ayah.n)}</Txt>
        </Txt>
      )}
      {q.showTranslit && (
        <Txt variant="body" tone="muted" style={{ fontStyle: 'italic' }}>
          {ayah.tr}
        </Txt>
      )}
      {/* The reader's own language comes first. */}
      {L.lang === 'bn' && q.showBangla && (
        <Txt variant="body" tone="soft" style={{ fontSize: 16, lineHeight: 26 }}>
          {ayah.bn}
        </Txt>
      )}
      {q.showEnglish && (
        <Txt variant="body" tone="soft">
          {ayah.en}
        </Txt>
      )}
      {L.lang !== 'bn' && q.showBangla && (
        <Txt variant="body" tone="soft" style={{ fontSize: 16, lineHeight: 26 }}>
          {ayah.bn}
        </Txt>
      )}
    </View>
  );
}

export default function ReaderScreen() {
  const t = useTheme();
  const L = useT();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ surah: string; ayah?: string }>();
  const n = Math.min(114, Math.max(1, parseInt(params.surah ?? '1', 10) || 1));
  const startAyah = params.ayah ? parseInt(params.ayah, 10) : undefined;
  const meta = surahMeta(n);
  const { data, error } = useSurah(n);
  const q = useSettings((s) => s.quran);
  const setSettings = useSettings((s) => s.set);
  const setLastRead = useQuranProgress((s) => s.setLastRead);
  const reciter = useSettings((s) => s.reciter);
  const view = useSettings((s) => s.readerView);
  const words = useSurahWords(n, view !== 'normal');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tafsirAyah, setTafsirAyah] = useState<number | null>(null);
  const listRef = useRef<FlatList<Ayah>>(null);
  useReadingTimer();

  // Recitation: one ayah at a time, continuing to the next until the surah ends.
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const playingRef = useRef<number | null>(null);
  const play = useCallback(
    (ayah: number | null) => {
      playingRef.current = ayah;
      setAudioError(false);
      setPlayingAyah(ayah);
      if (ayah === null) {
        player.pause();
        return;
      }
      player.replace({ uri: localAyahUri(reciter, n, ayah) ?? ayahAudioUrl(n, ayah, reciter) });
      player.play();
    },
    [player, n, reciter],
  );

  // When an ayah finishes, continue with the next one (and keep it in view).
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (st) => {
      if (!st.didJustFinish || playingRef.current === null) return;
      const next = playingRef.current + 1;
      if (next <= meta.ayahs) {
        play(next);
        listRef.current?.scrollToIndex({ index: next - 1, animated: true, viewPosition: 0.2 });
      } else play(null);
    });
    return () => sub.remove();
  }, [player, meta.ayahs, play]);

  // If a recitation doesn't start within a few seconds, say so instead of spinning silently.
  useEffect(() => {
    if (playingAyah === null || status.playing) return;
    const id = setTimeout(() => setAudioError(true), 8000);
    return () => clearTimeout(id);
  }, [playingAyah, status.playing]);

  // Remember the first fully visible ayah as the reading position.
  const [onViewableItemsChanged] = useState(() => ({ viewableItems }: { viewableItems: ViewToken<Ayah>[] }) => {
    const first = viewableItems.find((v) => v.isViewable)?.item;
    if (first) setLastRead({ surahNumber: n, surah: meta.name, surahMeaning: meta.meaning, ayah: first.n, totalAyahs: meta.ayahs });
  });

  // Jump to the requested ayah once the text is ready.
  useEffect(() => {
    if (!data || !startAyah || startAyah <= 1) return;
    const id = setTimeout(() => listRef.current?.scrollToIndex({ index: Math.min(startAyah, data.ayahs.length) - 1, animated: false, viewPosition: 0.1 }), 60);
    return () => clearTimeout(id);
  }, [data, startAyah]);

  const header = useMemo(
    () => (
      <View style={{ paddingHorizontal: GUTTER, paddingTop: insets.top + 12, gap: 18, paddingBottom: 8 }}>
        <ScreenHeader
          title={meta.name}
          subtitle={meta.meaning}
          right={<IconButton icon="textSize" label={L.t('reader.settings')} onPress={() => setSheetOpen(true)} />}
        />
        <Glass strong radius={28} padding={22} style={{ alignItems: 'center', gap: 10 }}>
          <Txt variant="arabic" style={{ textAlign: 'center', fontSize: 34, lineHeight: 60 }}>
            {meta.ar}
          </Txt>
          <Txt variant="caption" tone="muted">
            {L.t('reader.meta', { type: L.t(meta.type === 'Meccan' ? 'quran.makki' : 'quran.madani'), n: meta.ayahs, j: meta.juz })}
          </Txt>
          {n !== 1 && n !== 9 && (
            <>
              <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: t.line, marginVertical: 4 }} />
              <Txt variant="quran" style={{ textAlign: 'center', fontSize: 26, lineHeight: 52 }}>
                {BASMALA}
              </Txt>
            </>
          )}
          {n === 9 && (
            <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
              {L.t('reader.tawbah')}
            </Txt>
          )}
        </Glass>
        {audioError && (
          <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            {L.t('reader.audioError')}
          </Txt>
        )}
      </View>
    ),
    [insets.top, meta, n, t.line, audioError, L],
  );

  const footer = (
    <View style={{ paddingHorizontal: GUTTER, paddingTop: 20, paddingBottom: insets.bottom + 40, gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {n > 1 && (
          <Press style={{ flex: 1 }} onPress={() => router.replace({ pathname: '/quran/[surah]', params: { surah: String(n - 1) } })}>
            <Glass radius={20} padding={14} style={{ gap: 2 }}>
              <Txt variant="micro" tone="muted">
                {L.t('reader.previous')}
              </Txt>
              <Txt variant="title" numberOfLines={1}>
                {SURAHS[n - 2].name}
              </Txt>
            </Glass>
          </Press>
        )}
        {n < 114 && (
          <Press style={{ flex: 1 }} onPress={() => router.replace({ pathname: '/quran/[surah]', params: { surah: String(n + 1) } })}>
            <Glass radius={20} padding={14} style={{ gap: 2, alignItems: 'flex-end' }}>
              <Txt variant="micro" tone="muted">
                {L.t('reader.next')}
              </Txt>
              <Txt variant="title" numberOfLines={1}>
                {SURAHS[n].name}
              </Txt>
            </Glass>
          </Press>
        )}
      </View>
      <Txt variant="micro" tone="muted" style={{ textAlign: 'center' }}>
        {L.t('reader.sources')}
      </Txt>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.canvas }}>
      <Canvas />
      {error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
          <Txt variant="title">{L.t('reader.cantOpen')}</Txt>
          <Txt variant="body" tone="muted" style={{ textAlign: 'center' }}>
            {error.message}
          </Txt>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={data?.ayahs ?? []}
          keyExtractor={(a) => String(a.n)}
          extraData={`${view}-${words ? 1 : 0}`}
          renderItem={({ item }) => (
            <AyahRow
              surah={n}
              ayah={item}
              playing={playingAyah === item.n}
              onPlay={() => play(playingAyah === item.n ? null : item.n)}
              view={view}
              words={words?.a[item.n - 1]}
              onTafsir={() => setTafsirAyah(item.n)}
            />
          )}
          ListHeaderComponent={header}
          ListFooterComponent={data ? footer : <ActivityIndicator color={t.textMuted} style={{ marginTop: 40 }} />}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
            setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0.1 }), 120);
          }}
          initialNumToRender={Math.max(8, (startAyah ?? 0) + 4)}
          windowSize={9}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TafsirSheet surah={n} ayah={tafsirAyah} onClose={() => setTafsirAyah(null)} />

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={L.t('reader.settings')}>
        <Glass radius={22} padding={16} style={{ gap: 12 }}>
          <Segmented<ReaderView>
            value={view}
            onChange={(readerView) => setSettings({ readerView })}
            options={[
              { value: 'normal', label: L.t('reader.viewNormal') },
              { value: 'tajweed', label: L.t('reader.viewTajweed') },
              { value: 'words', label: L.t('reader.viewWords') },
            ]}
          />
          {view === 'tajweed' && (
            <View style={{ gap: 4 }}>
              {GROUPS.map((g) => (
                <Txt key={g} variant="caption" tone="soft">
                  {L.t(`reader.tj.${g}`)}
                </Txt>
              ))}
              <Txt variant="micro" tone="muted">
                {L.t('reader.tjSource')}
              </Txt>
            </View>
          )}
          {view === 'words' && (
            <Txt variant="micro" tone="muted">
              {L.t('reader.wordsSource')}
            </Txt>
          )}
          <Press
            onPress={() => {
              setSheetOpen(false);
              router.push('/recitation');
            }}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 }}
          >
            <Icon name="volume" size={18} color={t.text} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{L.t('reader.reciter')}</Txt>
              <Txt variant="caption" tone="muted">
                {L.lang === 'bn' ? reciterById(reciter).nameBn : reciterById(reciter).name}
              </Txt>
            </View>
            <Icon name="chevronRight" size={17} color={t.textMuted} />
          </Press>
        </Glass>
        <Glass radius={22} padding={16} style={{ gap: 14 }}>
          {(
            [
              ['showEnglish', L.t('reader.english'), L.t('reader.englishSrc')],
              ['showBangla', L.t('reader.bangla'), L.t('reader.banglaSrc')],
              ['showTranslit', L.t('reader.translit'), L.t('reader.translitSrc')],
            ] as const
          ).map(([k, label, source]) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{label}</Txt>
                <Txt variant="caption" tone="muted">
                  {source}
                </Txt>
              </View>
              <Toggle label={label} value={q[k]} onChange={(v) => setSettings({ quran: { ...q, [k]: v } })} />
            </View>
          ))}
        </Glass>
        <Glass radius={22} padding={16} style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt variant="bodyStrong">{L.t('reader.arabicSize')}</Txt>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <IconButton icon="minus" label={L.t('reader.smaller')} size={38} onPress={() => setSettings({ quran: { ...q, arabicSize: Math.max(22, q.arabicSize - 2) } })} />
              <IconButton icon="plus" label={L.t('reader.larger')} size={38} onPress={() => setSettings({ quran: { ...q, arabicSize: Math.min(44, q.arabicSize + 2) } })} />
            </View>
          </View>
          <Txt variant="quran" style={{ fontSize: q.arabicSize, lineHeight: Math.round(q.arabicSize * 2.1) }}>
            {BASMALA}
          </Txt>
        </Glass>
      </Sheet>
    </View>
  );
}
