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
import { refreshLiveLocation } from '@/features/prayer/liveLocation';
import { useSettings } from '@/features/settings/store';
import { fonts } from '@/theme/fonts';
import { translate, useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';

const ALIGNED_DEG = 3;

type Heading = { deg: number; kind: 'true' | 'magnetic'; /** Android: 0–3 calibration level. */ level: number } | null;

function useHeading() {
  const [heading, setHeading] = useState<Heading>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let alive = true;
    const noSignal = setTimeout(() => alive && setUnavailable(true), 2500);
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync(); // true north needs location access
        // Point from where the phone is now, not from where it was when the location was last set.
        if (perm.granted) refreshLiveLocation(translate(useSettings.getState().language, 'loc.current.fallback'), true);
        sub = await Location.watchHeadingAsync((h) => {
          if (!alive) return;
          clearTimeout(noSignal);
          setUnavailable(false);
          const level = Platform.OS === 'android' ? h.accuracy : 3;
          if (h.trueHeading >= 0) setHeading({ deg: h.trueHeading, kind: 'true', level });
          else setHeading({ deg: h.magHeading, kind: 'magnetic', level });
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
  const L = useT();
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
      <ScreenHeader title={L.t('qibla.title')} subtitle={`${loc.city}${loc.country ? `, ${loc.country}` : ''}`} />

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Chip live={!!heading} label={L.t(heading ? (heading.kind === 'true' ? 'qibla.compassTrue' : 'qibla.compassMag') : unavailable ? 'qibla.noCompass' : 'qibla.starting')} />
        <Chip icon="navigation" label={L.t('qibla.km', { km: L.num(Math.round(km).toLocaleString('en-US')) })} />
      </View>
      {heading && heading.level < 2 && (
        <Glass radius={20} padding={12} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icon name="refresh" size={18} color={t.text} />
          <Txt variant="caption" style={{ flex: 1 }}>
            {L.t('qibla.calibrate')}
          </Txt>
        </Glass>
      )}

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
            <Txt variant="h1">{L.t('qibla.inMakkah')}</Txt>
            <Txt variant="body" tone="muted" style={{ textAlign: 'center' }}>
              {L.t('qibla.inMakkahBody')}
            </Txt>
          </>
        ) : heading ? (
          <>
            <Txt variant="h1">{aligned ? L.t('qibla.facing') : L.t(offBy! > 0 ? 'qibla.turnRight' : 'qibla.turnLeft', { deg: Math.abs(Math.round(offBy!)) })}</Txt>
            <Txt variant="body" tone="muted" style={{ textAlign: 'center' }}>
              {L.t(aligned ? 'qibla.ahead' : 'qibla.hold')}
            </Txt>
          </>
        ) : (
          <>
            <Txt variant="h1" tabular>
              {L.num(bearing.toFixed(1))}°
            </Txt>
            <Txt variant="body" tone="muted" style={{ textAlign: 'center' }}>
              {L.t('qibla.bearing', { city: loc.city, deg: L.num(bearing.toFixed(1)) })}
              {unavailable ? ` ${L.t('qibla.useCompass')}` : ''}
            </Txt>
          </>
        )}
      </Glass>

      <Glass radius={22} padding={14} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <Icon name="info" size={18} color={t.textSoft} />
        <Txt variant="caption" tone="soft" style={{ flex: 1 }}>
          {L.t('qibla.tip')}
        </Txt>
      </Glass>

      <Press onPress={() => router.push('/settings/location')} style={{ alignSelf: 'center', padding: 8 }} accessibilityRole="button">
        <Txt variant="caption" tone="soft">
          {L.t('qibla.notIn', { city: loc.city })}
        </Txt>
      </Press>
    </Screen>
  );
}
