import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Field } from '@/components/Field';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Screen } from '@/components/Screen';
import { goBack, ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { CITIES, type City } from '@/data/cities';
import { LocationError, locateDevice } from '@/features/prayer/deviceLocation';
import { suggestedMethod } from '@/features/prayer/location';
import { useT } from '@/i18n';
import { useSettings } from '@/features/settings/store';
import { useTheme } from '@/theme/useTheme';

const normalise = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');

export default function LocationScreen() {
  const t = useTheme();
  const L = useT();
  const loc = useSettings((s) => s.location);
  const setLocation = useSettings((s) => s.setLocation);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = normalise(query);
    const list = q ? CITIES.filter((c) => normalise(c.name).includes(q) || normalise(c.country).includes(q)) : CITIES;
    return list;
  }, [query]);

  const choose = (c: City) => {
    setLocation({ city: c.name, country: c.country, cc: c.cc, latitude: c.lat, longitude: c.lng, timeZone: c.tz, source: 'city' }, true);
    goBack();
  };

  const useDevice = async () => {
    setBusy(true);
    setError(null);
    try {
      setLocation(await locateDevice(L.t('loc.current.fallback')), true);
      goBack();
    } catch (e) {
      setError(L.t(e instanceof LocationError && e.code === 'denied' ? 'loc.errDenied' : 'loc.errUnavailable'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('loc.title')} subtitle={L.t('loc.subtitle')} />

      <Glass strong radius={24} padding={16} style={{ gap: 4 }}>
        <Txt variant="eyebrow" tone="muted">
          {L.t('loc.current')}
        </Txt>
        <Txt variant="h2">
          {loc.city}
          {loc.country ? `, ${loc.country}` : ''}
        </Txt>
        <Txt variant="caption" tone="muted" tabular>
          {loc.latitude.toFixed(4)}°, {loc.longitude.toFixed(4)}° · {loc.timeZone}
        </Txt>
        {loc.source === 'gps' && (
          <Txt variant="caption" tone="soft" style={{ marginTop: 4 }}>
            {L.t('loc.auto')}
          </Txt>
        )}
      </Glass>

      <Press onPress={useDevice} disabled={busy} accessibilityRole="button" accessibilityLabel={L.t('loc.useDevice')}>
        <Glass radius={22} padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
            {busy ? <ActivityIndicator color={t.onInk} /> : <Icon name="locate" size={20} color={t.onInk} />}
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="title">{L.t('loc.useDevice')}</Txt>
            <Txt variant="caption" tone="muted">
              {L.t('loc.useDeviceSub')}
            </Txt>
          </View>
        </Glass>
      </Press>
      {error ? (
        <Txt variant="caption" tone="soft" style={{ paddingHorizontal: 6 }}>
          {error}
        </Txt>
      ) : null}

      <Field icon="search" placeholder={L.t('loc.searchPh')} value={query} onChangeText={setQuery} autoCorrect={false} />
      <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
        {L.t('loc.methodNote')}
      </Txt>

      <Glass radius={24} padding={0} style={{ paddingHorizontal: 14 }}>
        {results.map((c, i) => {
          const selected = loc.source === 'city' && c.name === loc.city && c.country === loc.country;
          return (
            <Press key={`${c.name}-${c.cc}`} onPress={() => choose(c)} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={`${c.name}, ${c.country}`}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  borderBottomWidth: i < results.length - 1 ? 1 : 0,
                  borderBottomColor: t.line,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">{c.name}</Txt>
                  <Txt variant="caption" tone="muted">
                    {c.country} · {L.t(`method.${suggestedMethod(c.cc)}`)}
                  </Txt>
                </View>
                {selected && <Icon name="check" size={18} color={t.text} strokeWidth={2.4} />}
              </View>
            </Press>
          );
        })}
        {results.length === 0 && (
          <Txt variant="body" tone="muted" style={{ paddingVertical: 24, textAlign: 'center' }}>
            {L.t('loc.noMatch', { q: query })}
          </Txt>
        )}
      </Glass>
    </Screen>
  );
}
