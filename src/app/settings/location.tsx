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
import { locateDevice } from '@/features/prayer/deviceLocation';
import { METHOD_LABEL, suggestedMethod } from '@/features/prayer/location';
import { useSettings } from '@/features/settings/store';
import { useTheme } from '@/theme/useTheme';

const normalise = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');

export default function LocationScreen() {
  const t = useTheme();
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
      setLocation(await locateDevice(), true);
      goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your location couldn’t be found.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen gap={16}>
      <ScreenHeader title="Location" subtitle="Prayer times and Qibla are calculated for this place" />

      <Glass strong radius={24} padding={16} style={{ gap: 4 }}>
        <Txt variant="eyebrow" tone="muted">
          Current
        </Txt>
        <Txt variant="h2">
          {loc.city}
          {loc.country ? `, ${loc.country}` : ''}
        </Txt>
        <Txt variant="caption" tone="muted" tabular>
          {loc.latitude.toFixed(4)}°, {loc.longitude.toFixed(4)}° · {loc.timeZone}
        </Txt>
      </Glass>

      <Press onPress={useDevice} disabled={busy} accessibilityRole="button" accessibilityLabel="Use my current location">
        <Glass radius={22} padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
            {busy ? <ActivityIndicator color={t.onInk} /> : <Icon name="locate" size={20} color={t.onInk} />}
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="title">Use my current location</Txt>
            <Txt variant="caption" tone="muted">
              Most accurate. Your location stays on this device.
            </Txt>
          </View>
        </Glass>
      </Press>
      {error ? (
        <Txt variant="caption" tone="soft" style={{ paddingHorizontal: 6 }}>
          {error}
        </Txt>
      ) : null}

      <Field icon="search" placeholder="Search city or country" value={query} onChangeText={setQuery} autoCorrect={false} />
      <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
        Choosing a place also selects the calculation method usually used there. You can change it in Prayer settings.
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
                    {c.country} · {METHOD_LABEL[suggestedMethod(c.cc)]}
                  </Txt>
                </View>
                {selected && <Icon name="check" size={18} color={t.text} strokeWidth={2.4} />}
              </View>
            </Press>
          );
        })}
        {results.length === 0 && (
          <Txt variant="body" tone="muted" style={{ paddingVertical: 24, textAlign: 'center' }}>
            No place matches “{query}”. Try “Use my current location”.
          </Txt>
        )}
      </Glass>
    </Screen>
  );
}
