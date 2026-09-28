import { useEffect, useRef, useState } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Coordinates, Qibla } from 'adhan';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { distanceKm, KAABA } from '@/lib/geo';
import { useSettings } from '@/features/settings/store';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

const ALIGNED_DEG = 3;

type Heading = { deg: number; kind: 'true' | 'magnetic' } | null;

function useHeading() {
  const [heading, setHeading] = useState<Heading>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let alive = true;
    const noSignal = setTimeout(() => alive && setUnavailable(true), 2500);
    (async () => {
      try {
        await Location.requestForegroundPermissionsAsync(); // true north needs location access
        sub = await Location.watchHeadingAsync((h) => {
          if (!alive) return;
          clearTimeout(noSignal);
          setUnavailable(false);
          if (h.trueHeading >= 0) setHeading({ deg: h.trueHeading, kind: 'true' });
          else setHeading({ deg: h.magHeading, kind: 'magnetic' });
        });
      } catch {
        if (alive) setUnavailable(true);
      }
    })();
    return () => {
      alive = false;
      clearTimeout(noSignal);
      sub?.remove();
    };
  }, []);
  return { heading, unavailable: unavailable && !heading };
}

/** Signed smallest difference a − b, in degrees (−180…180). */
const angleDiff = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;

function Dial({ size, bearing }: { size: number; bearing: number }) {
  const t = useTheme();
  const c = size / 2;
  const r = c - 10;
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  const rad = ((bearing - 90) * Math.PI) / 180;
  const kx = c + (r - 34) * Math.cos(rad);
  const ky = c + (r - 34) * Math.sin(rad);
  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={r} stroke={t.lineStrong} strokeWidth={1.5} fill={t.glassStrong} />
      {ticks.map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180;
        const major = deg % 30 === 0;
        const inner = r - (major ? 14 : 7);
        return (
          <Line
            key={deg}
            x1={c + inner * Math.cos(a)}
            y1={c + inner * Math.sin(a)}
            x2={c + r * Math.cos(a)}
            y2={c + r * Math.sin(a)}
            stroke={major ? t.text : t.lineStrong}
            strokeWidth={major ? 2 : 1}
          />
        );
      })}
      {(
        [
          ['N', 0],
          ['E', 90],
          ['S', 180],
          ['W', 270],
        ] as const
      ).map(([label, deg]) => {
        const a = ((deg - 90) * Math.PI) / 180;
        return (
          <SvgText key={label} x={c + (r - 30) * Math.cos(a)} y={c + (r - 30) * Math.sin(a) + 5} fill={t.text} fontSize={15} fontFamily={fonts.semibold} textAnchor="middle">
            {label}
          </SvgText>
        );
      })}
      {/* The Qibla line and the Kaaba marker, fixed to the bearing on the dial */}
      <Line x1={c} y1={c} x2={kx} y2={ky} stroke={t.ink} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={c} cy={c} r={5} fill={t.ink} />
      <G transform={`translate(${kx - 15}, ${ky - 15})`}>
        <Circle cx={15} cy={15} r={17} fill={t.ink} />
        <Path d="M7 11l8-4 8 4v9l-8 3-8-3z M7 11l8 3 8-3 M15 14v9 M7 14l8 3 8-3" stroke={t.onInk} strokeWidth={1.4} fill="none" strokeLinejoin="round" />
      </G>
    </Svg>
  );
}

export default function QiblaScreen() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const loc = useSettings((s) => s.location);
  const bearing = Qibla(new Coordinates(loc.latitude, loc.longitude));
  const km = distanceKm(loc.latitude, loc.longitude, KAABA.lat, KAABA.lng);
  const { heading, unavailable } = useHeading();
  const size = Math.min(width - 48, 330);

  // Rotate the dial so its N points north; take the short way round.
  const rotation = useSharedValue(0);
  const last = useRef(0);
  useEffect(() => {
    if (!heading) return;
    const target = last.current + angleDiff(-heading.deg, last.current);
    last.current = target;
    rotation.value = withSpring(target, { duration: 350, dampingRatio: 1 });
  }, [heading, rotation]);
  const dialStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  const offBy = heading ? angleDiff(bearing, heading.deg) : null;
  const aligned = offBy !== null && Math.abs(offBy) <= ALIGNED_DEG;
  const wasAligned = useRef(false);
  useEffect(() => {
    if (aligned && !wasAligned.current && Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    wasAligned.current = aligned;
  }, [aligned]);

  return (
    <Screen gap={18}>
      <ScreenHeader title="Qibla" subtitle={`${loc.city}${loc.country ? `, ${loc.country}` : ''}`} />

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Chip live={!!heading} label={heading ? (heading.kind === 'true' ? 'Compass · true north' : 'Compass · magnetic north') : unavailable ? 'No compass on this device' : 'Starting compass…'} />
        <Chip icon="navigation" label={`${Math.round(km).toLocaleString('en-US')} km to the Kaaba`} />
      </View>

      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        {/* Fixed pointer: the direction the top of the phone is facing */}
        <View style={{ width: 4, height: 26, borderRadius: 2, backgroundColor: aligned ? t.ink : t.lineStrong, marginBottom: 8 }} />
        <Animated.View style={dialStyle}>
          <Dial size={size} bearing={bearing} />
        </Animated.View>
      </View>

      <Glass strong radius={26} padding={18} style={{ alignItems: 'center', gap: 6 }}>
        {km < 25 ? (
          <>
            <Txt variant="h1">You’re in Makkah</Txt>
            <Txt variant="body" tone="muted" style={{ textAlign: 'center' }}>
              This close, a compass bearing isn’t precise enough. Face the Kaaba directly.
            </Txt>
          </>
        ) : heading ? (
          <>
            <Txt variant="h1">{aligned ? 'Facing the Qibla' : `Turn ${offBy! > 0 ? 'right' : 'left'} ${Math.abs(Math.round(offBy!))}°`}</Txt>
            <Txt variant="body" tone="muted" style={{ textAlign: 'center' }}>
              {aligned ? 'The Kaaba is straight ahead.' : 'Hold your phone flat and turn until the Kaaba reaches the top.'}
            </Txt>
          </>
        ) : (
          <>
            <Txt variant="h1" tabular>
              {bearing.toFixed(1)}°
            </Txt>
            <Txt variant="body" tone="muted" style={{ textAlign: 'center' }}>
              The Qibla from {loc.city} is {bearing.toFixed(1)}° clockwise from true north.
              {unavailable ? ' Use a compass, or open the app on a phone, to find this direction.' : ''}
            </Txt>
          </>
        )}
      </Glass>

      <Glass radius={22} padding={14} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <Icon name="info" size={18} color={t.textSoft} />
        <Txt variant="caption" tone="soft" style={{ flex: 1 }}>
          Keep the phone flat and away from metal, magnets and electronics. If the direction looks wrong, move the phone in a figure-8 to calibrate the compass.
        </Txt>
      </Glass>

      <Press onPress={() => router.push('/settings/location')} style={{ alignSelf: 'center', padding: 8 }} accessibilityRole="button">
        <Txt variant="caption" tone="soft">
          Not in {loc.city}? Change location
        </Txt>
      </Press>
    </Screen>
  );
}
