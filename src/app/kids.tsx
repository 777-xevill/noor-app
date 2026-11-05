import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Sheet } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { ALPHABET, type ArabicLetter } from '@/data/alphabet';
import { KIDS_DUAS, KIDS_REVIEWED, KIDS_SALAH } from '@/data/kidsSalah';
import { useT } from '@/i18n';
import { hasArabicVoice, speakArabic, stopSpeaking } from '@/lib/speakArabic';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export default function KidsScreen() {
  const t = useTheme();
  const L = useT();
  const lang = L.lang === 'bn' ? 'bn' : 'en';
  const [letter, setLetter] = useState<ArabicLetter | null>(null);
  const [noVoice, setNoVoice] = useState(false);
  useEffect(() => {
    hasArabicVoice().then((ok) => setNoVoice(!ok));
    return stopSpeaking;
  }, []);

  return (
    <Screen gap={18}>
      <ScreenHeader title={L.t('kids.title')} subtitle={L.t('kids.subtitle')} />

      <Reveal index={0}>
        <Glass strong radius={28} padding={18} style={{ gap: 12 }}>
          <Txt variant="title">{L.t('kids.alphabet')}</Txt>
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
            {ALPHABET.map((a, i) => (
              <Press key={i} onPress={() => {
                  setLetter(a);
                  speakArabic(a.ar);
                }} scaleTo={0.9} accessibilityRole="button" accessibilityLabel={lang === 'bn' ? a.nameBn : a.name} style={{ width: '22%', flexGrow: 1 }}>
                <View style={{ height: 76, borderRadius: 18, backgroundColor: t.pill, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt variant="arabic" style={{ fontSize: 32, lineHeight: 56 }}>
                    {a.letter}
                  </Txt>
                </View>
              </Press>
            ))}
          </View>
          <Txt variant="caption" tone="muted">
            {L.t('kids.alphabetHelp')}
          </Txt>
        </Glass>
      </Reveal>

      <Reveal index={1}>
        <ListGroup title={L.t('kids.learn')}>
          <ListRow icon="library" title={L.t('kids.surahs')} subtitle={L.t('kids.surahsSub')} onPress={() => router.push('/learn')} />
          <ListRow icon="sparkles" title={L.t('kids.names')} subtitle={L.t('kids.namesSub')} onPress={() => router.push('/names')} />
          <ListRow icon="heart" title={L.t('kids.shahadah')} subtitle={L.t('kids.shahadahSub')} onPress={() => router.push('/shahadah')} last />
        </ListGroup>
      </Reveal>

      <Reveal index={2}>
        <ListGroup title={L.t('kids.duas')} footer={L.t('kids.duasNote')}>
          {KIDS_DUAS.map((d, i) => (
            <ListRow
              key={d.chapter}
              icon="dua"
              title={L.t(`kids.dua.${d.key}`)}
              onPress={() => router.push({ pathname: '/duas/[chapter]', params: { chapter: String(d.chapter) } })}
              last={i === KIDS_DUAS.length - 1}
            />
          ))}
        </ListGroup>
      </Reveal>

      <Reveal index={3}>
        <Glass radius={26} padding={16} style={{ gap: 12 }}>
          <Txt variant="title">{L.t('kids.salah')}</Txt>
          {!KIDS_REVIEWED && (
            <Txt variant="caption" tone="soft">
              {L.t('kids.notReviewed')}
            </Txt>
          )}
          {KIDS_SALAH.map((s, i) => (
            <View key={s.id} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
                <Txt variant="bodyStrong" tone="onInk" tabular>
                  {L.num(i + 1)}
                </Txt>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="bodyStrong">{lang === 'bn' ? s.bn : s.en}</Txt>
                <Txt variant="body" tone="soft">
                  {lang === 'bn' ? s.textBn : s.textEn}
                </Txt>
              </View>
            </View>
          ))}
        </Glass>
      </Reveal>

      <Reveal index={4}>
        <Glass radius={22} padding={14} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icon name="shield" size={18} color={t.textSoft} />
          <Txt variant="caption" tone="muted" style={{ flex: 1 }}>
            {L.t('kids.parents')}
          </Txt>
        </Glass>
      </Reveal>

      <Sheet open={letter !== null} onClose={() => setLetter(null)} title={letter ? (lang === 'bn' ? letter.nameBn : letter.name) : ''}>
        {letter && (
          <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
            <Txt style={{ fontFamily: fonts.quran, fontSize: 120, lineHeight: 170 }}>{letter.letter}</Txt>
            <Txt variant="title">{lang === 'bn' ? letter.nameBn : letter.name}</Txt>
            <Txt variant="body" tone="soft">
              {L.t('kids.sound', { sound: letter.sound })}
            </Txt>
            <Press onPress={() => speakArabic(letter.ar)} scaleTo={0.95} accessibilityRole="button" accessibilityLabel={L.t('kids.listen')} style={{ marginTop: 8 }}>
              <View style={{ height: 48, paddingHorizontal: 22, borderRadius: 24, backgroundColor: t.ink, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="volume" size={18} color={t.onInk} />
                <Txt variant="title" tone="onInk">
                  {L.t('kids.listen')}
                </Txt>
              </View>
            </Press>
            {noVoice && (
              <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
                {L.t('kids.noVoice')}
              </Txt>
            )}
          </View>
        )}
      </Sheet>
    </Screen>
  );
}
