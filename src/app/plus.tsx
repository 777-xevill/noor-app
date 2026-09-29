import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { PRIVACY_URL, TERMS_URL } from '@/lib/site';
import { useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { DEMO_ENABLED } from '@/features/demo/seed';
import { billingEnabled, buy, getPlans, manageUrl, type Plan, restore } from '@/features/premium/billing';
import { usePlus, usePlusStore } from '@/features/premium/store';
import { fonts } from '@/theme/fonts';
import { onPhoto } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const PERKS: { icon: IconName; title: Key; body: Key }[] = [
  { icon: 'moon', title: 'plus.perkMidnight', body: 'plus.perkMidnight.d' },
  { icon: 'heart', title: 'plus.perkCards', body: 'plus.perkCards.d' },
  { icon: 'shield', title: 'plus.perkSupport', body: 'plus.perkSupport.d' },
];

const ORDER: Plan['kind'][] = ['annual', 'monthly', 'lifetime', 'other'];

export default function PlusScreen() {
  const t = useTheme();
  const L = useT();
  const plus = usePlus();
  const active = usePlusStore((s) => s.active);
  const preview = usePlusStore((s) => s.preview);
  const setPlus = usePlusStore((s) => s.set);
  const [plans, setPlans] = useState<Plan[] | null>(billingEnabled ? null : []);
  const [chosen, setChosen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!billingEnabled) return;
    getPlans()
      .then((p) => {
        const sorted = [...p].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
        setPlans(sorted);
        setChosen(sorted[0]?.id ?? null);
      })
      .catch(() => setPlans([]));
  }, []);

  const plan = plans?.find((p) => p.id === chosen);
  const store = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

  return (
    <Screen gap={18}>
      <ScreenHeader title={L.t('plus.title')} subtitle={L.t('plus.subtitle')} />

      <Reveal index={0}>
        <View style={{ borderRadius: 30, overflow: 'hidden', padding: 22, gap: 10, boxShadow: t.shadow }}>
          <LinearGradient colors={['#2E3238', '#101113']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <View>
            <Icon name="sparkles" size={24} color={onPhoto.text} />
          </View>
          <Txt style={{ fontFamily: fonts.semibold, fontSize: 24, lineHeight: 30, letterSpacing: L.lang === 'en' ? -0.6 : 0, color: onPhoto.text }}>
            {active ? L.t('plus.active') : L.t('plus.freeTitle')}
          </Txt>
          <Txt variant="body" color={onPhoto.textSoft}>
            {active ? L.t('plus.thanks') : L.t('plus.freeBody')}
          </Txt>
        </View>
      </Reveal>

      <Reveal index={1}>
        <Glass radius={26} padding={18} style={{ gap: 16 }}>
          <Txt variant="title">{L.t('plus.perks')}</Txt>
          {PERKS.map((p) => (
            <View key={p.title} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: t.pill, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={p.icon} size={18} color={t.text} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="bodyStrong">{L.t(p.title)}</Txt>
                <Txt variant="caption" tone="soft">
                  {L.t(p.body)}
                </Txt>
              </View>
              {plus && <Icon name="circleCheck" size={20} color={t.text} />}
            </View>
          ))}
        </Glass>
      </Reveal>

      {active ? (
        manageUrl ? (
          <Press onPress={() => Linking.openURL(manageUrl!)} accessibilityRole="link" style={{ alignSelf: 'center', padding: 8 }}>
            <Txt variant="bodyStrong" tone="soft">
              {L.t('plus.manage')}
            </Txt>
          </Press>
        ) : null
      ) : billingEnabled ? (
        <Reveal index={2}>
          <View style={{ gap: 12 }}>
            <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
              {L.t('plus.choose')}
            </Txt>
            {plans === null ? (
              <ActivityIndicator />
            ) : (
              plans.map((p) => {
                const selected = p.id === chosen;
                return (
                  <Press key={p.id} onPress={() => setChosen(p.id)} scaleTo={0.98} accessibilityRole="radio" accessibilityState={{ selected }}>
                    <Glass
                      strong={selected}
                      radius={22}
                      padding={16}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: selected ? t.ink : t.glassBorder, borderWidth: selected ? 1.5 : 1 }}
                    >
                      <Txt variant="title" style={{ flex: 1 }}>
                        {L.t(`plus.${p.kind}` as Key)}
                      </Txt>
                      <Txt variant="bodyStrong" tabular>
                        {p.price}
                      </Txt>
                    </Glass>
                  </Press>
                );
              })
            )}
            <Press
              onPress={async () => {
                if (!plan) return;
                setBusy(true);
                setNote(null);
                try {
                  await buy(plan);
                } catch {
                  setNote(L.t('plus.failed'));
                } finally {
                  setBusy(false);
                }
              }}
              disabled={!plan || busy}
              scaleTo={0.97}
              accessibilityRole="button"
            >
              <View style={{ height: 56, borderRadius: 28, backgroundColor: t.ink, opacity: plan ? 1 : 0.4, alignItems: 'center', justifyContent: 'center' }}>
                {busy ? <ActivityIndicator color={t.onInk} /> : <Txt variant="title" tone="onInk">{L.t('plus.continue')}</Txt>}
              </View>
            </Press>
            <Press
              onPress={async () => {
                setNote(null);
                try {
                  setNote(L.t((await restore()) ? 'plus.restored' : 'plus.nothingToRestore'));
                } catch {
                  setNote(L.t('plus.failed'));
                }
              }}
              accessibilityRole="button"
              style={{ alignSelf: 'center', padding: 8 }}
            >
              <Txt variant="bodyStrong" tone="soft">
                {L.t('plus.restore')}
              </Txt>
            </Press>
            {note ? (
              <Txt variant="caption" tone="soft" style={{ textAlign: 'center' }}>
                {note}
              </Txt>
            ) : null}
            <Txt variant="micro" tone="muted" style={{ textAlign: 'center', paddingHorizontal: 12 }}>
              {L.t('plus.legal', { store })}
            </Txt>
            {PRIVACY_URL && TERMS_URL && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18 }}>
                {[
                  [L.t('legal.terms'), TERMS_URL],
                  [L.t('legal.privacy'), PRIVACY_URL],
                ].map(([label, url]) => (
                  <Press key={url} onPress={() => Linking.openURL(url)} accessibilityRole="link" style={{ padding: 4 }}>
                    <Txt variant="caption" tone="soft" style={{ textDecorationLine: 'underline' }}>
                      {label}
                    </Txt>
                  </Press>
                ))}
              </View>
            )}
          </View>
        </Reveal>
      ) : (
        <Reveal index={2}>
          <View style={{ gap: 10 }}>
            <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
              {L.t('plus.off')}
            </Txt>
            {DEMO_ENABLED && (
              <View style={{ gap: 6, alignItems: 'flex-start' }}>
                <Press onPress={() => setPlus({ preview: !preview })} accessibilityRole="switch" accessibilityState={{ checked: preview }}>
                  <Chip variant={preview ? 'ink' : 'glass'} icon="sparkles" label={L.t('plus.preview')} />
                </Press>
                <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 4 }}>
                  {L.t('plus.previewNote')}
                </Txt>
              </View>
            )}
          </View>
        </Reveal>
      )}
    </Screen>
  );
}
