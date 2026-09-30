import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { CHECKLIST, HAJJ, HAJJ_KINDS, HAJJ_REVIEWED, REVIEWED_BY, type Step, UMRAH } from '@/data/hajj';
import { useT } from '@/i18n';
import { useHajjChecklist } from '@/features/hajj/store';
import { useTheme } from '@/theme/useTheme';

type Tab = 'umrah' | 'hajj' | 'list';

function StepCard({ step, n, lang }: { step: Step; n: number; lang: 'bn' | 'en' }) {
  const t = useTheme();
  const L = useT();
  return (
    <Glass radius={24} padding={16} style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="bodyStrong" tone="onInk" tabular>
            {L.num(n)}
          </Txt>
        </View>
        <Txt variant="title" style={{ flex: 1 }}>
          {lang === 'bn' ? step.bn : step.en}
        </Txt>
      </View>
      <Txt variant="body" tone="soft" style={{ lineHeight: 25 }}>
        {lang === 'bn' ? step.textBn : step.textEn}
      </Txt>
      {step.duas?.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {step.duas.map((id) => (
            <Press key={id} onPress={() => router.push({ pathname: '/duas/[chapter]', params: { chapter: String(id) } })} scaleTo={0.95} accessibilityRole="link">
              <Chip variant="glass" icon="dua" label={L.t('hajj.duasFor')} />
            </Press>
          ))}
        </View>
      ) : null}
    </Glass>
  );
}

export default function HajjScreen() {
  const t = useTheme();
  const L = useT();
  const lang = L.lang === 'bn' ? 'bn' : 'en';
  const [tab, setTab] = useState<Tab>('umrah');
  const done = useHajjChecklist((s) => s.done);
  const toggle = useHajjChecklist((s) => s.toggle);

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('hajj.title')} subtitle={L.t('hajj.subtitle')} />

      <Glass radius={22} padding={14} style={{ gap: 6 }}>
        <Txt variant="bodyStrong">{HAJJ_REVIEWED ? L.t('hajj.reviewedBy', { name: REVIEWED_BY ?? '' }) : L.t('hajj.notReviewed')}</Txt>
        <Txt variant="caption" tone="soft">
          {L.t('hajj.disclaimer')}
        </Txt>
      </Glass>

      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'umrah', label: L.t('hajj.umrah') },
          { value: 'hajj', label: L.t('hajj.hajj') },
          { value: 'list', label: L.t('hajj.list') },
        ]}
      />

      {tab === 'umrah' && (
        <View style={{ gap: 12 }}>
          {UMRAH.map((s, i) => (
            <Reveal key={s.id} index={i}>
              <StepCard step={s} n={i + 1} lang={lang} />
            </Reveal>
          ))}
        </View>
      )}

      {tab === 'hajj' && (
        <View style={{ gap: 12 }}>
          <Glass radius={24} padding={16} style={{ gap: 10 }}>
            <Txt variant="title">{L.t('hajj.kinds')}</Txt>
            {HAJJ_KINDS.map((k) => (
              <View key={k.id} style={{ gap: 2 }}>
                <Txt variant="bodyStrong">{lang === 'bn' ? k.bn : k.en}</Txt>
                <Txt variant="body" tone="soft">
                  {lang === 'bn' ? k.textBn : k.textEn}
                </Txt>
              </View>
            ))}
            <Txt variant="caption" tone="muted">
              {L.t('hajj.kindsNote')}
            </Txt>
          </Glass>
          {HAJJ.map((s, i) => (
            <StepCard key={s.id} step={s} n={i + 1} lang={lang} />
          ))}
        </View>
      )}

      {tab === 'list' && (
        <Glass radius={24} padding={16} style={{ gap: 4 }}>
          {CHECKLIST.map((c) => {
            const ticked = !!done[c.id];
            return (
              <Press key={c.id} onPress={() => toggle(c.id)} scaleTo={0.98} accessibilityRole="checkbox" accessibilityState={{ checked: ticked }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: ticked ? t.ink : 'transparent', borderWidth: ticked ? 0 : 1.5, borderColor: t.lineStrong }}>
                  {ticked && <Icon name="check" size={15} color={t.onInk} strokeWidth={2.6} />}
                </View>
                <Txt variant="body" style={{ flex: 1, opacity: ticked ? 0.55 : 1 }}>
                  {lang === 'bn' ? c.bn : c.en}
                </Txt>
              </Press>
            );
          })}
          <Txt variant="caption" tone="muted" style={{ paddingTop: 8 }}>
            {L.t('hajj.listNote')}
          </Txt>
        </Glass>
      )}
    </Screen>
  );
}
