import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field } from '@/components/Field';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Canvas } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { CITIES, type City } from '@/data/cities';
import { locateDevice } from '@/features/prayer/deviceLocation';
import { METHOD_LABEL } from '@/features/prayer/location';
import { alertsSupported, requestAlertPermission } from '@/features/prayer/notifications';
import { useSettings } from '@/features/settings/store';
import { fonts } from '@/theme/fonts';
import { GUTTER, onPhoto } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const PHOTO = require('../../assets/images/dome-ubudiah.jpg');
const STEPS = 4;
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

export default function OnboardingScreen() {
  const t = useTheme();
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
      s.setLocation(await locateDevice(), true);
      next();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Your location couldn’t be found.');
    } finally {
      setBusy(false);
    }
  };

  const enter = FadeInDown.duration(520).easing(Easing.out(Easing.cubic)).withInitialValues({ opacity: 0, transform: [{ translateY: 16 }] });

  return (
    <View style={{ flex: 1, backgroundColor: t.canvas }}>
      <Canvas />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: GUTTER, gap: 18 }} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={{ flexDirection: 'row', gap: 6, alignSelf: 'center', marginTop: 6 }}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View key={i} style={{ width: i === step ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: i <= step ? t.ink : t.lineStrong }} />
          ))}
        </View>

        <Animated.View key={step} entering={enter} style={{ flex: 1, gap: 18 }}>
          {step === 0 && (
            <>
              <View style={{ height: 360, borderRadius: 32, overflow: 'hidden', justifyContent: 'flex-end', padding: 22, boxShadow: t.shadow }}>
                <Image source={PHOTO} resizeMode="cover" style={StyleSheet.absoluteFill} />
                <LinearGradient colors={onPhoto.scrim} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
                <Txt variant="eyebrow" color={onPhoto.textSoft}>
                  Welcome to Noor
                </Txt>
                <Txt style={{ fontFamily: fonts.bold, fontSize: 38, lineHeight: 42, letterSpacing: -1.4, color: onPhoto.text }}>Assalamu alaikum</Txt>
              </View>
              <Txt variant="body" tone="soft" style={{ fontSize: 17, lineHeight: 26 }}>
                Prayer times you can trust, the Quran in Arabic, English and Bangla, and the daily adhkar, calm and free of clutter.
              </Txt>
              <View style={{ gap: 10 }}>
                {[
                  ['mosque', 'Accurate prayer times and alerts for your city'],
                  ['book', 'The full Quran, offline, with recitation'],
                  ['shield', 'Private: your data stays on your phone'],
                ].map(([icon, text]) => (
                  <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Icon name={icon as 'mosque'} size={20} color={t.text} />
                    <Txt variant="body">{text}</Txt>
                  </View>
                ))}
              </View>
              <View style={{ flex: 1 }} />
              <PrimaryButton label="Bismillah, let’s begin" onPress={next} />
            </>
          )}

          {step === 1 && (
            <>
              <Txt variant="h1">What should we call you?</Txt>
              <Txt variant="body" tone="muted">
                Used only to greet you in the app.
              </Txt>
              <Field placeholder="Your name" value={s.displayName} onChangeText={s.setDisplayName} autoCapitalize="words" autoFocus maxLength={40} />
              <View style={{ flex: 1 }} />
              <PrimaryButton label={s.displayName ? 'Continue' : 'Skip for now'} onPress={next} />
            </>
          )}

          {step === 2 && (
            <>
              <Txt variant="h1">Where do you pray?</Txt>
              <Txt variant="body" tone="muted">
                Prayer times and the Qibla are calculated for your location. It never leaves your phone.
              </Txt>
              <PrimaryButton label="Use my current location" onPress={useDevice} busy={busy} />
              {message ? (
                <Txt variant="caption" tone="soft">
                  {message}
                </Txt>
              ) : null}
              <Txt variant="eyebrow" tone="muted" style={{ marginTop: 6 }}>
                Or choose your city
              </Txt>
              <Field icon="search" placeholder="Search city or country" value={query} onChangeText={setQuery} autoCorrect={false} />
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

          {step === 3 && (
            <>
              <Txt variant="h1">Never miss a prayer</Txt>
              <Txt variant="body" tone="muted">
                We’ll remind you when each prayer begins in {s.location.city}. Times use the {METHOD_LABEL[s.method]} method with {s.madhab === 'Hanafi' ? 'Hanafi' : 'standard'} Asr; you can change this any time in Prayer settings.
              </Txt>
              <Glass radius={24} padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Icon name="bellRing" size={22} color={t.text} />
                <Txt variant="body" style={{ flex: 1 }}>
                  Alerts for Fajr, Dhuhr, Asr, Maghrib and Isha
                </Txt>
              </Glass>
              {!alertsSupported && (
                <Txt variant="caption" tone="muted">
                  Alerts work in the phone app.
                </Txt>
              )}
              {message ? (
                <Txt variant="caption" tone="soft">
                  {message}
                </Txt>
              ) : null}
              <View style={{ flex: 1 }} />
              <PrimaryButton
                label={alertsSupported ? 'Allow prayer alerts' : 'Finish'}
                busy={busy}
                onPress={async () => {
                  if (!alertsSupported) return finish();
                  setBusy(true);
                  const granted = await requestAlertPermission();
                  setBusy(false);
                  if (granted) finish();
                  else setMessage('Notifications are off. You can turn them on later in your phone’s Settings.');
                }}
              />
              {alertsSupported && <TextButton label="Not now" onPress={finish} />}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
