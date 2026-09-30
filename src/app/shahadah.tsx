import { Image, Share, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Glass } from '@/components/Glass';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { SHAHADAH } from '@/data/phrases';
import { onPhoto } from '@/theme/tokens';
import { useT } from '@/i18n';
import { speakArabic, stopSpeaking } from '@/lib/speakArabic';
import { useEffect } from 'react';
import { useTheme } from '@/theme/useTheme';

const PHOTO = require('../../assets/images/sunset-istanbul.jpg');

export default function ShahadahScreen() {
  const t = useTheme();
  const L = useT();
  const bn = L.lang === 'bn';
  useEffect(() => stopSpeaking, []);
  return (
    <Screen gap={16}>
      <ScreenHeader
        title={L.t('shahadah.title')}
        subtitle={L.t('shahadah.subtitle')}
        right={<IconButton icon="share" label={L.t('shahadah.share')} onPress={() => Share.share({ message: `${SHAHADAH.ar}\n\n${SHAHADAH.en}` }).catch(() => {})} />}
      />
      <View style={{ borderRadius: 30, overflow: 'hidden', minHeight: 360, justifyContent: 'center', padding: 22, boxShadow: t.shadow }}>
        <Image source={PHOTO} resizeMode="cover" style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(14,16,19,0.35)', 'rgba(14,16,19,0.7)']} style={StyleSheet.absoluteFill} />
        <Txt variant="arabic" color={onPhoto.text} style={{ textAlign: 'center', fontSize: 30, lineHeight: 64 }}>
          {SHAHADAH.ar}
        </Txt>
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <IconButton icon="volume" label={L.t('kids.listen')} variant="photo" size={48} onPress={() => speakArabic(SHAHADAH.ar, 0.75)} />
        </View>
      </View>
      <Glass radius={26} padding={18} style={{ gap: 12 }}>
        <Txt variant="eyebrow" tone="muted">
          {L.t('shahadah.pron')}
        </Txt>
        <Txt variant="body" style={{ fontStyle: 'italic' }}>
          {bn ? SHAHADAH.trBn : SHAHADAH.tr}
        </Txt>
        <View style={{ height: 1, backgroundColor: t.line }} />
        <Txt variant="eyebrow" tone="muted">
          {L.t('shahadah.meaning')}
        </Txt>
        <Txt variant="body" tone="soft">
          {SHAHADAH.en}
        </Txt>
        <Txt variant="body" tone="soft" style={{ fontSize: 16, lineHeight: 26 }}>
          {SHAHADAH.bn}
        </Txt>
      </Glass>
      <Txt variant="caption" tone="muted" style={{ textAlign: 'center', paddingHorizontal: 12 }}>
        {L.t('shahadah.note')}
      </Txt>
    </Screen>
  );
}
