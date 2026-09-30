import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import * as Speech from 'expo-speech';
import { Field } from '@/components/Field';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press, PressLite } from '@/components/Press';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { NAMES_99 } from '@/data/names';
import { QURAN_EXCERPTS } from '@/data/quranExcerpts';
import { useT } from '@/i18n';
import { hasArabicVoice, stopSpeaking } from '@/lib/speakArabic';
import { useTheme } from '@/theme/useTheme';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export default function NamesScreen() {
  const t = useTheme();
  const L = useT();
  const [query, setQuery] = useState('');
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [playingAll, setPlayingAll] = useState(false);
  const [noVoice, setNoVoice] = useState(false);
  const allRef = useRef(false);
  useEffect(() => {
    hasArabicVoice().then((ok) => setNoVoice(!ok));
    return () => {
      allRef.current = false;
      stopSpeaking();
    };
  }, []);

  // Read one name; when playing all, go on to the next when it finishes.
  const speakName = (n: number) => {
    const name = NAMES_99[n - 1];
    setSpeaking(n);
    Speech.stop();
    Speech.speak(name.ar, {
      language: 'ar',
      rate: 0.8,
      onDone: () => {
        if (allRef.current && n < NAMES_99.length) speakName(n + 1);
        else {
          allRef.current = false;
          setPlayingAll(false);
          setSpeaking(null);
        }
      },
      onStopped: () => setSpeaking((s) => (s === n ? null : s)),
    });
  };
  const say = (n: number) => {
    allRef.current = false;
    setPlayingAll(false);
    speakName(n);
  };
  const playAll = () => {
    if (allRef.current) {
      allRef.current = false;
      setPlayingAll(false);
      setSpeaking(null);
      stopSpeaking();
      return;
    }
    allRef.current = true;
    setPlayingAll(true);
    speakName(1);
  };
  const list = useMemo(() => {
    const q = norm(query);
    return q ? NAMES_99.filter((n) => norm(n.tr).includes(q) || norm(n.en).includes(q) || String(n.n) === q) : NAMES_99;
  }, [query]);

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('names.title')} subtitle={L.t('names.subtitle')} />
      <Glass strong radius={24} padding={16}>
        <Txt variant="quran" style={{ textAlign: 'center', fontSize: 24, lineHeight: 50 }}>
          {QURAN_EXCERPTS.names.ar}
        </Txt>
        <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          “{QURAN_EXCERPTS.names.en}” ({QURAN_EXCERPTS.names.ref})
        </Txt>
      </Glass>
      <Press onPress={playAll} scaleTo={0.97} accessibilityRole="button" accessibilityLabel={L.t(playingAll ? 'names.stop' : 'names.playAll')}>
        <Glass radius={22} padding={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={playingAll ? 'pause' : 'play'} size={18} color={t.onInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="title">{L.t(playingAll ? 'names.stop' : 'names.playAll')}</Txt>
            <Txt variant="caption" tone="muted">
              {L.t(noVoice ? 'kids.noVoice' : 'names.tapHint')}
            </Txt>
          </View>
        </Glass>
      </Press>
      <Field icon="search" placeholder={L.t('names.searchPh')} value={query} onChangeText={setQuery} autoCorrect={false} />
      <Glass radius={24} padding={0} style={{ paddingHorizontal: 14 }}>
        {list.map((n, i) => (
          <PressLite
            key={n.n}
            onPress={() => say(n.n)}
            accessibilityRole="button"
            accessibilityLabel={`${n.tr}, ${n.en}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: i < list.length - 1 ? 1 : 0, borderBottomColor: t.line }}
          >
            <Txt variant="caption" tone="muted" tabular style={{ width: 26 }}>
              {L.num(n.n)}
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
            <Icon name="volume" size={16} color={speaking === n.n ? t.text : t.lineStrong} />
          </PressLite>
        ))}
      </Glass>
      <Txt variant="micro" tone="muted" style={{ textAlign: 'center' }}>
        {L.t('names.source')}
      </Txt>
    </Screen>
  );
}
