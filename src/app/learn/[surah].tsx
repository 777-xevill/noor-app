import { useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { FadeUp, Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { SURAHS } from '@/data/surahs';
import { WBW, type WbwWord } from '@/data/wbw';
import { useT } from '@/i18n';
import { buildQuiz } from '@/features/learn/quiz';
import { PASS, useLearn } from '@/features/learn/store';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

const QUESTIONS = 8;
const wordAudio = (w: WbwWord) => `https://audio.qurancdn.com/${w.audio}`;
const tick = (kind: 'ok' | 'no') =>
  Platform.OS !== 'web' && Haptics.notificationAsync(kind === 'ok' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);

function Practice({ surah }: { surah: number }) {
  const t = useTheme();
  const L = useT();
  const record = useLearn((s) => s.record);
  const [seed, setSeed] = useState(() => surah * 1000 + 1);
  const lang = L.lang === 'bn' ? 'bn' : 'en';
  const quiz = useMemo(() => buildQuiz(WBW.find((s) => s.surah === surah)!, WBW, lang, QUESTIONS, seed), [surah, lang, seed]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const done = i >= quiz.length;

  const restart = () => {
    setSeed((s) => s + 1);
    setI(0);
    setPicked(null);
    setCorrect(0);
  };

  if (done) {
    const score = correct / quiz.length;
    return (
      <FadeUp>
        <Glass radius={26} padding={22} style={{ gap: 12, alignItems: 'center' }}>
          <Icon name={score >= PASS ? 'circleCheck' : 'repeat'} size={30} color={t.text} />
          <Txt style={{ fontFamily: fonts.semibold, fontSize: 30, lineHeight: 36 }} tabular>
            {L.t('learn.score', { n: correct, total: quiz.length })}
          </Txt>
          <Txt variant="body" tone="soft" style={{ textAlign: 'center' }}>
            {L.t(score >= PASS ? 'learn.passed' : 'learn.again')}
          </Txt>
          <Press onPress={restart} scaleTo={0.97} accessibilityRole="button" style={{ alignSelf: 'stretch' }}>
            <View style={{ height: 50, borderRadius: 25, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
              <Txt variant="title" tone="onInk">
                {L.t('learn.practiceAgain')}
              </Txt>
            </View>
          </Press>
        </Glass>
      </FadeUp>
    );
  }

  const q = quiz[i];
  const answer = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    const ok = k === q.answer;
    tick(ok ? 'ok' : 'no');
    if (ok) setCorrect((c) => c + 1);
  };
  const next = () => {
    const last = i + 1 >= quiz.length;
    // `correct` already counts this question: it was updated when the answer was picked.
    if (last) record(surah, correct / quiz.length);
    setI(i + 1);
    setPicked(null);
  };

  return (
    <FadeUp key={`${seed}-${i}`} style={{ gap: 14 }}>
      <Txt variant="caption" tone="muted" tabular>
        {L.t('learn.questionN', { n: i + 1, total: quiz.length })}
      </Txt>
      <Glass radius={26} padding={22} style={{ alignItems: 'center', gap: 6 }}>
        <Txt variant="quran" style={{ textAlign: 'center', fontSize: 40, lineHeight: 80 }}>
          {q.word.ar}
        </Txt>
        <Txt variant="caption" tone="muted">
          {q.word.tr}
        </Txt>
        <Txt variant="bodyStrong" tone="soft" style={{ marginTop: 6 }}>
          {L.t('learn.whatMeans')}
        </Txt>
      </Glass>
      <View style={{ gap: 10 }}>
        {q.options.map((o, k) => {
          const isAnswer = picked !== null && k === q.answer;
          const isWrongPick = picked === k && k !== q.answer;
          return (
            <Press key={o} onPress={() => answer(k)} scaleTo={0.98} accessibilityRole="button" accessibilityState={{ selected: picked === k }}>
              <View
                style={{
                  minHeight: 52,
                  borderRadius: 18,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: isAnswer ? t.ink : t.glassStrong,
                  borderWidth: 1.5,
                  borderColor: isWrongPick ? '#C8413B' : isAnswer ? t.ink : t.glassBorder,
                }}
              >
                <Txt variant="body" color={isAnswer ? t.onInk : t.text} style={{ flex: 1 }}>
                  {o}
                </Txt>
                {isAnswer && <Icon name="check" size={18} color={t.onInk} strokeWidth={2.4} />}
                {isWrongPick && <Icon name="close" size={18} color="#C8413B" strokeWidth={2.4} />}
              </View>
            </Press>
          );
        })}
      </View>
      {picked !== null && (
        <Press onPress={next} scaleTo={0.97} accessibilityRole="button">
          <View style={{ height: 50, borderRadius: 25, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="title" tone="onInk">
              {L.t(i + 1 >= quiz.length ? 'learn.finish' : 'learn.next')}
            </Txt>
          </View>
        </Press>
      )}
    </FadeUp>
  );
}

function Read({ surah }: { surah: number }) {
  const t = useTheme();
  const L = useT();
  const data = WBW.find((s) => s.surah === surah)!;
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const play = (key: string, w: WbwWord) => {
    setPlaying(key);
    player.replace({ uri: wordAudio(w) });
    player.play();
  };
  const active = status.playing ? playing : null;

  return (
    <View style={{ gap: 14 }}>
      <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 4 }}>
        {L.t('learn.tapWord')}
      </Txt>
      {data.ayahs.map((a, ai) => (
        <Reveal key={a.n} index={ai}>
          <Glass radius={24} padding={14} style={{ gap: 10 }}>
            <Txt variant="micro" tone="muted" tabular>
              {L.num(`${surah}:${a.n}`)}
            </Txt>
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
              {a.words.map((w, wi) => {
                const key = `${a.n}:${wi}`;
                const on = active === key;
                return (
                  <Press key={key} onPress={() => play(key, w)} scaleTo={0.95} accessibilityRole="button" accessibilityLabel={`${w.tr}: ${L.lang === 'bn' ? w.bn : w.en}`}>
                    <View
                      style={{
                        minWidth: 84,
                        maxWidth: 150,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 16,
                        alignItems: 'center',
                        gap: 2,
                        backgroundColor: on ? t.ink : t.pill,
                      }}
                    >
                      <Txt variant="quran" color={on ? t.onInk : t.text} style={{ fontSize: 26, lineHeight: 56, textAlign: 'center' }}>
                        {w.ar}
                      </Txt>
                      <Txt variant="micro" color={on ? t.onInk : t.textMuted} style={{ textAlign: 'center' }}>
                        {w.tr}
                      </Txt>
                      <Txt variant="caption" color={on ? t.onInk : t.textSoft} style={{ textAlign: 'center' }}>
                        {L.lang === 'bn' ? w.bn : w.en}
                      </Txt>
                    </View>
                  </Press>
                );
              })}
            </View>
          </Glass>
        </Reveal>
      ))}
    </View>
  );
}

export default function LessonScreen() {
  const L = useT();
  const { surah: param } = useLocalSearchParams<{ surah: string }>();
  const surah = Number(param);
  const meta = SURAHS.find((s) => s.n === surah);
  const [mode, setMode] = useState<'read' | 'practice'>('read');

  if (!meta || !WBW.some((s) => s.surah === surah)) return <Screen><ScreenHeader title={L.t('learn.title')} /></Screen>;

  return (
    <Screen gap={16}>
      <ScreenHeader title={meta.name} subtitle={meta.meaning} />
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'read', label: L.t('learn.read') },
          { value: 'practice', label: L.t('learn.practice') },
        ]}
      />
      {mode === 'read' ? <Read surah={surah} /> : <Practice surah={surah} />}
      <Txt variant="micro" tone="muted" style={{ textAlign: 'center' }}>
        {L.t('learn.source')}
      </Txt>
    </Screen>
  );
}
