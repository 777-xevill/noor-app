import { useRef, useState } from 'react';
import { Image, Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import { Chip } from '@/components/Chip';
import { Field } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { useSettings } from '@/features/settings/store';
import { fonts } from '@/theme/fonts';
import { onPhoto } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const KINDS: { id: 'eid' | 'ramadan'; title: Key; line: Key }[] = [
  { id: 'eid', title: 'cards.eid', line: 'cards.eidLine' },
  { id: 'ramadan', title: 'cards.ramadan', line: 'cards.ramadanLine' },
];

const BACKGROUNDS = [
  require('../../assets/images/hero-medina.jpg'),
  require('../../assets/images/dome-ubudiah.jpg'),
  require('../../assets/images/sunset-istanbul.jpg'),
  require('../../assets/images/minaret.jpg'),
  require('../../assets/images/dune.jpg'),
];

export default function CardsScreen() {
  const t = useTheme();
  const L = useT();
  const defaultName = useSettings((s) => s.displayName);
  const [kind, setKind] = useState(KINDS[0]);
  const [bg, setBg] = useState(0);
  const [name, setName] = useState(defaultName);
  const [note, setNote] = useState<string | null>(null);
  const card = useRef<View>(null);

  const text = `${L.t(kind.title)}\n${L.t(kind.line)}${name ? `\n${L.t('cards.from', { name })}` : ''}`;

  const share = async () => {
    setNote(null);
    try {
      if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) throw new Error('image sharing unavailable');
      const uri = await captureRef(card, { format: 'jpg', quality: 0.92 });
      await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: L.t('cards.share') });
    } catch {
      // Fall back to sharing the words.
      await Share.share({ message: text }).catch(() => {});
      if (Platform.OS !== 'web') setNote(L.t('cards.shareFail'));
    }
  };

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('cards.title')} subtitle={L.t('cards.subtitle')} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {KINDS.map((k) => (
          <Press key={k.id} onPress={() => setKind(k)} scaleTo={0.94} accessibilityRole="tab" accessibilityState={{ selected: k.id === kind.id }}>
            <Chip variant={k.id === kind.id ? 'ink' : 'glass'} label={L.t(k.title)} />
          </Press>
        ))}
      </View>

      {/* The card itself — this view is what gets captured and shared. */}
      <View ref={card} collapsable={false} style={{ aspectRatio: 4 / 5, borderRadius: 30, overflow: 'hidden', justifyContent: 'flex-end', padding: 24, boxShadow: t.shadow }}>
        <Image source={BACKGROUNDS[bg]} resizeMode="cover" style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(14,16,19,0.05)', 'rgba(14,16,19,0.25)', 'rgba(14,16,19,0.82)']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', top: 22, left: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="moonStar" size={18} color={onPhoto.text} />
          <Txt variant="eyebrow" color={onPhoto.textSoft}>
            {L.t('app.name')}
          </Txt>
        </View>
        <Txt style={{ fontFamily: fonts.bold, fontSize: 44, lineHeight: 52, letterSpacing: L.lang === 'en' ? -1.4 : 0, color: onPhoto.text }}>{L.t(kind.title)}</Txt>
        <Txt variant="body" color={onPhoto.textSoft} style={{ fontSize: 17, lineHeight: 25, marginTop: 6 }}>
          {L.t(kind.line)}
        </Txt>
        {name ? (
          <Txt variant="title" color={onPhoto.text} style={{ marginTop: 14 }}>
            {L.t('cards.from', { name })}
          </Txt>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {BACKGROUNDS.map((src, i) => (
          <Press key={i} onPress={() => setBg(i)} scaleTo={0.92} accessibilityRole="radio" accessibilityState={{ selected: i === bg }}>
            <View style={{ width: 64, height: 80, borderRadius: 16, overflow: 'hidden', borderWidth: i === bg ? 2.5 : 0, borderColor: t.ink }}>
              <Image source={src} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
            </View>
          </Press>
        ))}
      </ScrollView>

      <Field placeholder={L.t('cards.namePh')} value={name} onChangeText={setName} maxLength={30} autoCapitalize="words" />

      <Press onPress={share} scaleTo={0.97} accessibilityRole="button" accessibilityLabel={L.t('cards.share')}>
        <View style={{ height: 56, borderRadius: 28, backgroundColor: t.ink, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="share" size={18} color={t.onInk} />
          <Txt variant="title" tone="onInk">
            {L.t('cards.share')}
          </Txt>
        </View>
      </Press>
      {note ? (
        <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          {note}
        </Txt>
      ) : null}
    </Screen>
  );
}
