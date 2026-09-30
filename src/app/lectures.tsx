import { useState } from 'react';
import { Linking, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import { CHANNELS } from '@/features/lectures/channels';
import { useTheme } from '@/theme/useTheme';

type Lang = 'en' | 'bn';

export default function LecturesScreen() {
  const t = useTheme();
  const L = useT();
  const [lang, setLang] = useState<Lang>('en');
  const list = CHANNELS.filter((c) => c.lang === lang);

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('lectures.title')} subtitle={L.t('lectures.subtitle')} />

      <Segmented<Lang>
        value={lang}
        onChange={setLang}
        options={[
          { value: 'en', label: 'English' },
          { value: 'bn', label: 'বাংলা' },
        ]}
      />

      {list.length === 0 ? (
        <Glass radius={22} padding={16} style={{ gap: 6 }}>
          <Txt variant="bodyStrong">{L.t('lectures.none')}</Txt>
          <Txt variant="body" tone="soft">
            {L.t('lectures.noneD')}
          </Txt>
        </Glass>
      ) : (
        list.map((c, i) => (
          <Reveal key={c.id} index={i}>
            <Glass radius={24} padding={16} style={{ gap: 10 }}>
              <Txt variant="title">{c.name}</Txt>
              <Txt variant="body" tone="soft">
                {L.lang === 'bn' ? c.aboutBn : c.about}
              </Txt>
              <View style={{ flexDirection: 'row' }}>
                <Chip variant="glass" label="YouTube" />
              </View>
              <Press onPress={() => Linking.openURL(c.url).catch(() => {})} scaleTo={0.97} accessibilityRole="link">
                <View style={{ height: 48, borderRadius: 24, backgroundColor: t.ink, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="arrowUpRight" size={17} color={t.onInk} />
                  <Txt variant="title" tone="onInk">
                    {L.t('lectures.open')}
                  </Txt>
                </View>
              </Press>
            </Glass>
          </Reveal>
        ))
      )}

      <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
        {L.t('lectures.note')}
      </Txt>
    </Screen>
  );
}
