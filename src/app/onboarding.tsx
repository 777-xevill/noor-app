import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field } from '@/components/Field';
import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Canvas } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { CITIES, type City } from '@/data/cities';
import { LANGS, useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { LocationError, locateDevice } from '@/features/prayer/deviceLocation';
import { alertsSupported, requestAlertPermission } from '@/features/prayer/notifications';
import { useSettings } from '@/features/settings/store';
import { fonts } from '@/theme/fonts';
import { GUTTER, onPhoto } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const PHOTO = require('../../assets/images/dome-ubudiah.jpg');
const STEPS = 5; // language · welcome · name · location · alerts
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function PrimaryButton({ label, onPress, busy }: { label: string; onPress: () => void; busy?: boolean }) {
  const t = useTheme();
  return (
    <Press onPress={onPress} disabled={busy} scaleTo={0.97} accessibilityRole="button" accessibilityLabel={label}>
      <View style={{ height: 56, borderRadius: 28, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
        {busy ? <ActivityIndicator color={t.onInk} /> : <Txt variant="title" tone="onInk">{label}</Txt>}
      </View>
    </Press>
  );
}

function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Press onPress={onPress} accessibilityRole="button" style={{ alignSelf: 'center', padding: 10 }}>
      <Txt variant="bodyStrong" tone="soft">
        {label}
      </Txt>
    </Press>
  );
}

const POINTS: [IconName, Key][] = [
  ['mosque', 'ob.point1'],
  ['book', 'ob.point2'],
  ['shield', 'ob.point3'],
];

export default function OnboardingScreen() {
  const t = useTheme();
  const L = useT();
  const insets = useSafeAreaInsets();
  const s = useSettings();
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const finish = () => {
    s.set({ onboarded: true });
    router.replace('/');
  };
  const next = () => {
    setMessage(null);
    if (step + 1 >= STEPS) finish();
    else setStep(step + 1);
  };

  const cities = useMemo(() => {
    const q = norm(query);
    return (q ? CITIES.filter((c) => norm(c.name).includes(q) || norm(c.country).includes(q)) : CITIES).slice(0, 30);
  }, [query]);

  const pickCity = (c: City) => {
    s.setLocation({ city: c.name, country: c.country, cc: c.cc, latitude: c.lat, longitude: c.lng, timeZone: c.tz, source: 'city' }, true);
    next();
  };

  const useDevice = async () => {
    setBusy(true);
    setMessage(null);
    try {
      s.setLocation(await locateDevice(L.t('loc.current.fallback')), true);
      next();
    } catch (e) {
      setMessage(L.t(e instanceof LocationError && e.code === 'denied' ? 'loc.errDenied' : 'loc.errUnavailable'));
    } finally {
      setBusy(false);
    }
  };

  const enter = FadeInDown.duration(520).easing(Easing.out(Easing.cubic)).withInitialValues({ opacity: 0, transform: [{ translateY: 16 }] });

  return (
    <View style={{ flex: 1, backgroundColor: t.canvas }}>
      <Canvas />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: GUTTER, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress */}
        <View style={{ flexDirection: 'row', gap: 6, alignSelf: 'center', marginTop: 6 }}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View key={i} style={{ width: i === step ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: i <= step ? t.ink : t.lineStrong }} />
          ))}
        </View>

        <Animated.View key={step} entering={enter} style={{ flex: 1, gap: 18 }}>
          {step === 0 && (
            <>
              <Txt variant="h1">{L.t('ob.language')}</Txt>
              <Txt variant="body" tone="muted">
                {L.t('ob.languageSub')}
              </Txt>
              <View style={{ gap: 10 }}>
                {LANGS.map((lang) => {
                  const selected = s.language === lang.code;
                  return (
                    <Press key={lang.code} onPress={() => s.set({ language: lang.code })} scaleTo={0.98} accessibilityRole="radio" accessibilityState={{ selected }}>
                      <Glass
                        strong={selected}
                        radius={22}
                        padding={18}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: selected ? t.ink : t.glassBorder, borderWidth: selected ? 1.5 : 1 }}
                      >
                        <View style={{ flex: 1 }}>
                          <Txt variant="h2">{lang.name}</Txt>
                          {lang.name !== lang.english && (
                            <Txt variant="caption" tone="muted">
                              {lang.english}
                            </Txt>
                          )}
                        </View>
                        {selected && <Icon name="circleCheck" size={22} color={t.ink} />}
                      </Glass>
                    </Press>
                  );
                })}
              </View>
              <View style={{ flex: 1 }} />
              <PrimaryButton label={L.t('common.continue')} onPress={next} />
            </>
          )}

          {step === 1 && (
            <>
              <View style={{ height: 360, borderRadius: 32, overflow: 'hidden', justifyContent: 'flex-end', padding: 22, boxShadow: t.shadow }}>
                <Image source={PHOTO} resizeMode="cover" style={StyleSheet.absoluteFill} />
                <LinearGradient colors={onPhoto.scrim} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
                <Txt variant="eyebrow" color={onPhoto.textSoft}>
                  {L.t('ob.welcome')}
                </Txt>
                <Txt style={{ fontFamily: fonts.bold, fontSize: 38, lineHeight: 46, letterSpacing: L.lang === 'en' ? -1.4 : 0, color: onPhoto.text }}>{L.t('ob.salam')}</Txt>
              </View>
              <Txt variant="body" tone="soft" style={{ fontSize: 17, lineHeight: 26 }}>
                {L.t('ob.intro')}
              </Txt>
              <View style={{ gap: 10 }}>
                {POINTS.map(([icon, key]) => (
                  <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Icon name={icon} size={20} color={t.text} />
                    <Txt variant="body" style={{ flex: 1 }}>
                      {L.t(key)}
                    </Txt>
                  </View>
                ))}
              </View>
              <View style={{ flex: 1 }} />
              <PrimaryButton label={L.t('ob.begin')} onPress={next} />
            </>
          )}

          {step === 2 && (
            <>
              <Txt variant="h1">{L.t('ob.name')}</Txt>
              <Txt variant="body" tone="muted">
                {L.t('ob.nameSub')}
              </Txt>
              <Field placeholder={L.t('ob.namePh')} value={s.displayName} onChangeText={s.setDisplayName} autoCapitalize="words" autoFocus maxLength={40} />
              <View style={{ flex: 1 }} />
              <PrimaryButton label={L.t(s.displayName ? 'common.continue' : 'common.skip')} onPress={next} />
            </>
          )}

          {step === 3 && (
            <>
              <Txt variant="h1">{L.t('ob.where')}</Txt>
              <Txt variant="body" tone="muted">
                {L.t('ob.whereSub')}
              </Txt>
              <PrimaryButton label={L.t('loc.useDevice')} onPress={useDevice} busy={busy} />
              {message ? (
                <Txt variant="caption" tone="soft">
                  {message}
                </Txt>
              ) : null}
              <Txt variant="eyebrow" tone="muted" style={{ marginTop: 6 }}>
                {L.t('ob.orCity')}
              </Txt>
              <Field icon="search" placeholder={L.t('loc.searchPh')} value={query} onChangeText={setQuery} autoCorrect={false} />
              <Glass radius={24} padding={0} style={{ paddingHorizontal: 14 }}>
                {cities.map((c, i) => (
                  <Press key={`${c.name}-${c.cc}`} onPress={() => pickCity(c)} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={`${c.name}, ${c.country}`}>
                    <View style={{ paddingVertical: 12, borderBottomWidth: i < cities.length - 1 ? 1 : 0, borderBottomColor: t.line }}>
                      <Txt variant="bodyStrong">{c.name}</Txt>
                      <Txt variant="caption" tone="muted">
                        {c.country}
                      </Txt>
                    </View>
                  </Press>
                ))}
              </Glass>
            </>
          )}

          {step === 4 && (
            <>
              <Txt variant="h1">{L.t('ob.alerts')}</Txt>
              <Txt variant="body" tone="muted">
                {L.t('ob.alertsSub', { city: s.location.city, method: L.t(`method.${s.method}`), madhab: L.t(`madhab.${s.madhab}`) })}
              </Txt>
              <Glass radius={24} padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Icon name="bellRing" size={22} color={t.text} />
                <Txt variant="body" style={{ flex: 1 }}>
                  {L.t('ob.alertsList')}
                </Txt>
              </Glass>
              {!alertsSupported && (
                <Txt variant="caption" tone="muted">
                  {L.t('ob.alertsPhone')}
                </Txt>
              )}
              {message ? (
                <Txt variant="caption" tone="soft">
                  {message}
                </Txt>
              ) : null}
              <View style={{ flex: 1 }} />
              <PrimaryButton
                label={L.t(alertsSupported ? 'ob.allow' : 'common.finish')}
                busy={busy}
                onPress={async () => {
                  if (!alertsSupported) return finish();
                  setBusy(true);
                  const granted = await requestAlertPermission();
                  setBusy(false);
                  if (granted) finish();
                  else setMessage(L.t('ob.denied'));
                }}
              />
              {alertsSupported && <TextButton label={L.t('common.notNow')} onPress={finish} />}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
