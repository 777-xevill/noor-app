import { useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { FadeUp, Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { SURAHS } from '@/data/surahs';
import { useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { AskError, askEnabled, askNoor, type AskResult, type AskStage } from '@/features/ask/ask';
import { MAX_QUESTION } from '@/features/ask/prompts';
import type { Passage } from '@/features/ask/search';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

const EXAMPLES: Key[] = ['ask.ex1', 'ask.ex2', 'ask.ex3'];

/** A cited source, shown from the app's own text, never the model's wording. */
function SourceCard({ p }: { p: Passage }) {
  const t = useTheme();
  const L = useT();
  const meta = p.surah ? SURAHS[p.surah - 1] : null;
  const open = () =>
    p.kind === 'quran' ? router.push({ pathname: '/quran/[surah]', params: { surah: String(p.surah), ayah: String(p.ayah) } }) : router.push('/duas');
  return (
    <Press onPress={open} scaleTo={0.985} accessibilityRole="button">
      <Glass radius={22} padding={16} style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: t.pill }}>
            <Txt variant="micro" tabular>
              {p.tag}
            </Txt>
          </View>
          <Txt variant="caption" tone="muted" style={{ flex: 1 }} numberOfLines={1}>
            {meta ? `${meta.name} ${L.num(`${p.surah}:${p.ayah}`)}` : `${L.t('ask.hisn')} · ${p.chapter}`}
          </Txt>
          <Icon name="chevronRight" size={15} color={t.textMuted} />
        </View>
        <Txt variant={p.kind === 'quran' ? 'quran' : 'arabic'} numberOfLines={4} style={{ fontSize: 22, lineHeight: 44 }}>
          {p.ar}
        </Txt>
        <Txt variant="body" tone="soft">
          {L.lang === 'bn' && p.bn ? p.bn : p.en}
        </Txt>
      </Glass>
    </Press>
  );
}

export default function AskScreen() {
  const t = useTheme();
  const L = useT();
  const [question, setQuestion] = useState('');
  const [stage, setStage] = useState<AskStage | null>(null);
  const [result, setResult] = useState<(AskResult & { q: string }) | null>(null);
  const [error, setError] = useState<AskError['code'] | null>(null);

  const ask = async (q = question) => {
    const text = q.trim();
    if (text.length < 3 || stage) return;
    setQuestion(text);
    setError(null);
    setResult(null);
    try {
      const r = await askNoor(text, L.lang, setStage);
      setResult({ ...r, q: text });
    } catch (e) {
      setError(e instanceof AskError ? e.code : 'network');
    } finally {
      setStage(null);
    }
  };

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('ask.title')} subtitle={L.t('ask.subtitle')} />

      <Reveal index={0}>
        <Glass radius={26} padding={16} style={{ gap: 12 }}>
          <TextInput
            value={question}
            onChangeText={(v) => setQuestion(v.slice(0, MAX_QUESTION))}
            placeholder={L.t('ask.placeholder')}
            placeholderTextColor={t.textMuted}
            multiline
            editable={askEnabled}
            style={{ minHeight: 70, fontFamily: L.lang === 'bn' ? 'HindSiliguri-Regular' : fonts.regular, fontSize: 16, lineHeight: 23, color: t.text, textAlignVertical: 'top' }}
          />
          <Press onPress={() => ask()} disabled={!askEnabled || !!stage || question.trim().length < 3} scaleTo={0.97} accessibilityRole="button">
            <View
              style={{
                height: 48,
                borderRadius: 24,
                backgroundColor: t.ink,
                opacity: askEnabled && question.trim().length >= 3 ? 1 : 0.4,
                flexDirection: 'row',
                gap: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {stage ? <ActivityIndicator color={t.onInk} /> : <Icon name="sparkles" size={17} color={t.onInk} />}
              <Txt variant="title" tone="onInk">
                {stage ? L.t(stage === 'searching' ? 'ask.searching' : 'ask.writing') : L.t('ask.ask')}
              </Txt>
            </View>
          </Press>
          {!askEnabled && (
            <Txt variant="caption" tone="muted">
              {L.t('ask.off')}
            </Txt>
          )}
        </Glass>
      </Reveal>

      {!result && !stage && askEnabled && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {EXAMPLES.map((k) => (
            <Press key={k} onPress={() => ask(L.t(k))} scaleTo={0.95} accessibilityRole="button">
              <Chip variant="glass" label={L.t(k)} />
            </Press>
          ))}
        </View>
      )}

      {error && (
        <Glass radius={22} padding={16} style={{ gap: 8 }}>
          <Txt variant="body" tone="soft">
            {L.t(`ask.err.${error}` as Key)}
          </Txt>
          {error === 'signin' && (
            <Press onPress={() => router.push('/settings/account')} accessibilityRole="button">
              <Txt variant="bodyStrong">{L.t('ask.signInCta')}</Txt>
            </Press>
          )}
        </Glass>
      )}

      {result && (
        <FadeUp style={{ gap: 14 }}>
          <Glass radius={26} padding={18} style={{ gap: 10 }}>
            <Txt variant="eyebrow" tone="muted">
              {L.t('ask.answer')}
            </Txt>
            <Txt variant="body" style={{ fontSize: 16, lineHeight: 25 }}>
              {result.text || L.t('ask.noAnswer')}
            </Txt>
          </Glass>
          {result.sources.length > 0 && (
            <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
              {L.t('ask.sources')}
            </Txt>
          )}
          {result.sources.map((p) => (
            <SourceCard key={p.tag} p={p} />
          ))}
        </FadeUp>
      )}

      <Txt variant="micro" tone="muted" style={{ textAlign: 'center', paddingHorizontal: 12 }}>
        {L.t('ask.disclaimer')}
      </Txt>
    </Screen>
  );
}
