import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, View } from 'react-native';
import * as Location from 'expo-location';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { fromDayKey } from '@/lib/dates';
import { type I18n, useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { DEMO_ENABLED } from '@/features/demo/seed';
import { DEMO_SNAPSHOT } from '@/features/places/demoSnapshot';
import { distanceLabel, placeName } from '@/features/places/format';
import { findPlaces, type Place, type PlaceKind, toPlaces } from '@/features/places/overpass';
import { useSettings } from '@/features/settings/store';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

type Origin = { lat: number; lng: number; label: string; here: boolean };
type Answer = { status: 'error' } | { status: 'ok'; places: Place[]; radiusKm: number; sample?: string };
type Result = { key: string } & Answer;

const RADII = [3000, 10000];

/** Nearby places, widening the circle when there's little close by. */
async function lookup(kind: PlaceKind, o: Origin): Promise<Answer> {
  try {
    if (DEMO_ENABLED && Platform.OS === 'web') throw new Error('the web preview cannot reach Overpass');
    let places: Place[] = [];
    let radius = RADII[0];
    for (radius of RADII) {
      places = await findPlaces(kind, o.lat, o.lng, radius);
      if (places.length >= 3) break;
    }
    return { status: 'ok', places, radiusKm: radius / 1000 };
  } catch {
    // The web preview can't reach Overpass; demo builds show a real saved snapshot instead, and say so.
    if (!DEMO_ENABLED) return { status: 'error' };
    const s = DEMO_SNAPSHOT;
    return { status: 'ok', places: toPlaces(kind, s.places[kind], s.lat, s.lng), radiusKm: s.radius / 1000, sample: s.at };
  }
}

const direction = (L: I18n, bearing: number) => L.t(`places.dir.${Math.round(bearing / 45) % 8}` as Key);

/** North-up sketch of what's around: you in the middle, each place at its bearing and distance. */
function Radar({ places, radiusKm, onPick }: { places: Place[]; radiusKm: number; onPick: (p: Place) => void }) {
  const t = useTheme();
  const L = useT();
  const size = 260;
  const c = size / 2;
  const r = c - 18;
  const shown = places.slice(0, 40);
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {[1, 2, 3].map((i) => (
          <Circle key={i} cx={c} cy={c} r={(r * i) / 3} fill="none" stroke={t.lineStrong} strokeWidth={1} strokeDasharray={i < 3 ? '2 4' : undefined} />
        ))}
        <Line x1={c} y1={c - r} x2={c} y2={c + r} stroke={t.line} strokeWidth={1} />
        <Line x1={c - r} y1={c} x2={c + r} y2={c} stroke={t.line} strokeWidth={1} />
        <SvgText x={c} y={12} fontSize={11} fontFamily={fonts.semibold} fill={t.textMuted} textAnchor="middle">
          N
        </SvgText>
        {shown
          .slice()
          .reverse()
          .map((p, i) => {
            const d = (Math.min(p.km, radiusKm) / radiusKm) * r;
            const a = (p.bearing * Math.PI) / 180;
            const nearest = i === shown.length - 1;
            return (
              <G key={p.id} onPress={() => onPick(p)}>
                <Circle cx={c + d * Math.sin(a)} cy={c - d * Math.cos(a)} r={nearest ? 7 : 4.5} fill={nearest ? t.ink : t.textSoft} opacity={nearest ? 1 : 0.7} />
              </G>
            );
          })}
        <Circle cx={c} cy={c} r={9} fill={t.canvas} stroke={t.ink} strokeWidth={2.5} />
      </Svg>
      <Txt variant="micro" tone="muted">
        {L.t('places.within', { km: radiusKm })}
      </Txt>
    </View>
  );
}

export default function MosquesScreen() {
  const t = useTheme();
  const L = useT();
  const loc = useSettings((s) => s.location);
  const [kind, setKind] = useState<PlaceKind>('mosque');
  const [origin, setOrigin] = useState<Origin>({ lat: loc.latitude, lng: loc.longitude, label: loc.city, here: loc.source === 'gps' });
  const [answer, setAnswer] = useState<Result | null>(null);
  const [picked, setPicked] = useState<Place | null>(null);
  const [locNote, setLocNote] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Each lookup has a key; until its answer arrives, the screen shows it as loading.
  const key = `${kind}|${origin.lat}|${origin.lng}|${attempt}`;
  useEffect(() => {
    let live = true;
    lookup(kind, origin).then((r) => live && setAnswer({ key, ...r }));
    return () => {
      live = false;
    };
  }, [key, kind, origin]);
  const result: Result | { status: 'loading' } = answer?.key === key ? answer : { status: 'loading' };

  const useHere = async () => {
    setLocNote(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) throw new Error('denied');
      const pos = (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 })) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: L.t('places.hereNow'), here: true });
    } catch {
      setLocNote(L.t('places.locDenied', { city: loc.city }));
    }
  };

  const openDirections = (p: Place) => {
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${p.lat},${p.lng}&q=${encodeURIComponent(placeName(L, p))}`
        : `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
    Linking.openURL(url).catch(() => {});
  };

  const status = result.status === 'ok' ? result : null;

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('places.title')} subtitle={L.t('places.subtitle')} />

      <Segmented<PlaceKind>
        value={kind}
        onChange={setKind}
        options={[
          { value: 'mosque', label: L.t('places.mosques') },
          { value: 'halal', label: L.t('places.halal') },
        ]}
      />

      <Reveal index={0}>
        <Glass radius={26} padding={16} style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name={origin.here ? 'locate' : 'mapPin'} size={18} color={t.text} />
            <Txt variant="title" style={{ flex: 1 }} numberOfLines={1}>
              {L.t('places.around', { place: origin.label })}
            </Txt>
          </View>
          {status && status.places.length > 0 && <Radar places={status.places} radiusKm={status.radiusKm} onPick={setPicked} />}
          {!origin.here && (
            <>
              <Txt variant="caption" tone="muted">
                {L.t('places.cityNote', { city: loc.city })}
              </Txt>
              <Press onPress={useHere} scaleTo={0.97} accessibilityRole="button">
                <View style={{ height: 46, borderRadius: 23, backgroundColor: t.ink, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="locate" size={16} color={t.onInk} />
                  <Txt variant="bodyStrong" tone="onInk">
                    {L.t('places.useHere')}
                  </Txt>
                </View>
              </Press>
            </>
          )}
          {locNote ? (
            <Txt variant="caption" tone="soft">
              {locNote}
            </Txt>
          ) : null}
        </Glass>
      </Reveal>

      {kind === 'halal' && (
        <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 4 }}>
          {loc.cc === 'BD' ? `${L.t('places.halalBd')} ` : ''}
          {L.t('places.halalNote')}
        </Txt>
      )}

      {result.status === 'loading' && (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 24 }}>
          <ActivityIndicator color={t.textMuted} />
          <Txt variant="caption" tone="muted">
            {L.t('places.loading')}
          </Txt>
        </View>
      )}

      {result.status === 'error' && (
        <Glass radius={22} padding={16} style={{ gap: 10, alignItems: 'flex-start' }}>
          <Txt variant="body" tone="soft">
            {L.t('places.error')}
          </Txt>
          <Press onPress={() => setAttempt((a) => a + 1)} accessibilityRole="button" style={{ paddingVertical: 4 }}>
            <Txt variant="bodyStrong">{L.t('places.retry')}</Txt>
          </Press>
        </Glass>
      )}

      {status && status.places.length === 0 && (
        <Txt variant="body" tone="muted" style={{ paddingHorizontal: 4 }}>
          {L.t('places.none', { km: status.radiusKm })}
        </Txt>
      )}

      {status && status.places.length > 0 && (
        <Reveal index={1}>
          <Glass radius={24} padding={0} style={{ paddingHorizontal: 14 }}>
            {status.places.slice(0, 40).map((p, i, list) => (
              <Press key={p.id} onPress={() => setPicked(p)} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={`${placeName(L, p)}, ${distanceLabel(L, p.km)}`}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: i < list.length - 1 ? 1 : 0, borderBottomColor: t.line }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: i === 0 ? t.ink : t.pill, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={p.kind === 'mosque' ? 'mosque' : 'heart'} size={17} color={i === 0 ? t.onInk : t.text} />
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Txt variant="bodyStrong" numberOfLines={1}>
                      {placeName(L, p)}
                    </Txt>
                    <Txt variant="caption" tone="muted" tabular>
                      {L.t('places.away', { distance: distanceLabel(L, p.km), direction: direction(L, p.bearing) })}
                      {p.amenity && ['restaurant', 'fast_food', 'cafe'].includes(p.amenity) ? ` · ${L.t(`places.kind.${p.amenity}` as Key)}` : ''}
                    </Txt>
                  </View>
                  <Icon name="chevronRight" size={16} color={t.textMuted} />
                </View>
              </Press>
            ))}
          </Glass>
        </Reveal>
      )}

      <Txt variant="micro" tone="muted" style={{ textAlign: 'center' }}>
        {status?.sample ? `${L.t('places.sample', { date: L.shortDate(fromDayKey(status.sample)) })} ` : ''}
        {L.t('places.osm')}
      </Txt>

      <Sheet open={!!picked} onClose={() => setPicked(null)} title={picked ? placeName(L, picked) : ''}>
        {picked && (
          <View style={{ gap: 14 }}>
            {[picked.name, picked.nameEn, picked.nameBn]
              .filter((n, i, all): n is string => !!n && n !== placeName(L, picked) && all.indexOf(n) === i)
              .map((n) => (
                <Txt key={n} variant="body" tone="soft">
                  {n}
                </Txt>
              ))}
            <Txt variant="bodyStrong" tabular>
              {L.t('places.away', { distance: distanceLabel(L, picked.km), direction: direction(L, picked.bearing) })}
            </Txt>
            <Press onPress={() => openDirections(picked)} scaleTo={0.97} accessibilityRole="link">
              <View style={{ height: 52, borderRadius: 26, backgroundColor: t.ink, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="navigation" size={17} color={t.onInk} />
                <Txt variant="title" tone="onInk">
                  {L.t('places.directions')}
                </Txt>
              </View>
            </Press>
            <Press
              onPress={() => Linking.openURL(`https://www.openstreetmap.org/${picked.id}`).catch(() => {})}
              accessibilityRole="link"
              style={{ alignSelf: 'center', padding: 6 }}
            >
              <Txt variant="caption" tone="soft">
                {L.t('places.improve')}
              </Txt>
            </Press>
          </View>
        )}
      </Sheet>
    </Screen>
  );
}
