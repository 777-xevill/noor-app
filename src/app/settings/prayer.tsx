import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import * as IntentLauncher from 'expo-intent-launcher';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router } from 'expo-router';
import { Icon } from '@/components/Icon';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Press } from '@/components/Press';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { toHijri } from '@/lib/hijri';
import { useT } from '@/i18n';
import { ADHAN_ASSET, ADHAN_SECONDS } from '@/features/prayer/adhan';
import { METHODS, suggestedMadhab, suggestedMethod } from '@/features/prayer/location';
import { alertsSupported, requestAlertPermission } from '@/features/prayer/notifications';
import { useSchedule } from '@/features/prayer/useSchedule';
import { type AdjustableTime, type AlertKind, type AlertPrayer, type HighLatitude, useSettings } from '@/features/settings/store';
import { useTheme } from '@/theme/useTheme';

const ADJUSTABLE: AdjustableTime[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const ALERT_PRAYERS: AlertPrayer[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** Plays the alert clip exactly as it will sound, with a ring that fills as it plays. */
function AdhanPreview() {
  const t = useTheme();
  const L = useT();
  const player = useAudioPlayer(ADHAN_ASSET);
  const status = useAudioPlayerStatus(player);
  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  // Back to the start when it ends, so the next tap plays it again.
  useEffect(() => {
    if (status.didJustFinish) player.seekTo(0).catch(() => {});
  }, [status.didJustFinish, player]);

  const toggle = () => {
    if (status.playing) {
      player.pause();
      player.seekTo(0).catch(() => {});
    } else player.play();
  };
  const label = L.t(status.playing ? 'ps.adhanStop' : 'ps.adhanPlay');

  return (
    <ListGroup footer={L.t('ps.adhanFooter')}>
      <ListRow
        icon="volume"
        title={L.t('ps.adhanTitle')}
        subtitle={L.t('ps.adhanSub', { n: L.num(ADHAN_SECONDS) })}
        onPress={toggle}
        right={
          <View accessibilityLabel={label} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute' }}>
              <ProgressRing size={40} stroke={2.5} progress={status.playing ? progress : 0} color={t.text} track={t.line} />
            </View>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={status.playing ? 'pause' : 'play'} size={14} color={t.onInk} strokeWidth={2.4} />
            </View>
          </View>
        }
        last
      />
    </ListGroup>
  );
}

export default function PrayerSettingsScreen() {
  const t = useTheme();
  const L = useT();
  const s = useSettings();
  const { schedule } = useSchedule(60_000);
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const localMethod = suggestedMethod(s.location.cc);
  const localMadhab = suggestedMadhab(s.location.cc);
  const signed = (v: number, unit: 'minutes' | 'days') =>
    v === 0 ? L.t(unit === 'minutes' ? 'common.minutes' : 'common.days', { n: 0 }) : `${v > 0 ? '+' : '−'}${L.t(unit === 'minutes' ? 'common.minutes' : 'common.days', { n: Math.abs(v) })}`;

  return (
    <Screen gap={20}>
      <ScreenHeader title={L.t('ps.title')} subtitle={`${s.location.city}${s.location.country ? `, ${s.location.country}` : ''}`} />

      <ListGroup title={L.t('ps.location')}>
        <ListRow
          icon="mapPin"
          title={s.location.city}
          subtitle={L.t(s.location.source === 'gps' ? 'ps.fromDevice' : 'ps.fromList')}
          onPress={() => router.push('/settings/location')}
          last
        />
      </ListGroup>

      <ListGroup
        title={L.t('ps.method')}
        footer={L.t('ps.methodFooter', { country: s.location.country || L.t('ps.yourArea'), method: L.t(`method.${localMethod}`) })}
      >
        {METHODS.map((m, i) => (
          <ListRow
            key={m.key}
            title={L.t(`method.${m.key}`)}
            subtitle={L.t(`method.${m.key}.d`)}
            onPress={() => s.set({ method: m.key })}
            right={s.method === m.key ? <Icon name="check" size={18} color={t.text} strokeWidth={2.4} /> : <View style={{ width: 18 }} />}
            last={i === METHODS.length - 1}
          />
        ))}
      </ListGroup>

      <View style={{ gap: 8 }}>
        <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
          {L.t('ps.asr')}
        </Txt>
        <Segmented
          value={s.madhab}
          onChange={(madhab) => s.set({ madhab })}
          options={[
            { value: 'Shafi', label: L.t('madhab.Shafi') },
            { value: 'Hanafi', label: L.t('madhab.Hanafi') },
          ]}
        />
        <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
          {L.t('ps.asrNote', { common: L.t(`madhab.${localMadhab}`) })}
        </Txt>
      </View>

      <View style={{ gap: 8 }}>
        <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
          {L.t('ps.highLat')}
        </Txt>
        <Segmented<HighLatitude>
          value={s.highLatitude}
          onChange={(highLatitude) => s.set({ highLatitude })}
          options={[
            { value: 'auto', label: L.t('ps.hl.auto') },
            { value: 'middleOfTheNight', label: L.t('ps.hl.middle') },
            { value: 'seventhOfTheNight', label: L.t('ps.hl.seventh') },
            { value: 'twilightAngle', label: L.t('ps.hl.angle') },
          ]}
        />
        <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
          {L.t('ps.highLatNote')}
        </Txt>
      </View>

      <ListGroup title={L.t('ps.adjust')} footer={L.t('ps.adjustFooter')}>
        {ADJUSTABLE.map((k, i) => (
          <ListRow
            key={k}
            title={L.prayer(k)}
            right={
              <Stepper
                label={L.t('ps.adjustment', { prayer: L.prayer(k) })}
                value={s.adjustments[k]}
                min={-30}
                max={30}
                format={(v) => signed(v, 'minutes')}
                onChange={(v) => s.set({ adjustments: { ...s.adjustments, [k]: v } })}
              />
            }
            last={i === ADJUSTABLE.length - 1}
          />
        ))}
      </ListGroup>

      <ListGroup title={L.t('ps.hijri')} footer={L.t('ps.hijriFooter')}>
        <ListRow
          title={`${L.hijri(toHijri(schedule.day, s.hijriOffset))} ${L.t('common.ah')}`}
          subtitle={L.t('common.today')}
          right={
            <Stepper label={L.t('ps.hijriAdjust')} value={s.hijriOffset} min={-2} max={2} format={(v) => signed(v, 'days')} onChange={(v) => s.set({ hijriOffset: v })} />
          }
          last
        />
      </ListGroup>

      <View style={{ gap: 8 }}>
        <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
          {L.t('ps.alerts')}
        </Txt>
        {!alertsSupported ? (
          <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
            {L.t('ps.alertsWeb')}
          </Txt>
        ) : permission !== 'granted' ? (
          <Press
            onPress={async () => setPermission((await requestAlertPermission()) ? 'granted' : 'denied')}
            accessibilityRole="button"
            style={{ paddingHorizontal: 6 }}
          >
            <Txt variant="caption" tone="soft">
              {L.t(permission === 'denied' ? 'ps.alertsDenied' : 'ps.alertsAsk')}
            </Txt>
          </Press>
        ) : null}
        <ListGroup>
          {ALERT_PRAYERS.map((k, i) => (
            <View key={k} style={{ gap: 8, paddingVertical: 12, borderBottomWidth: i < ALERT_PRAYERS.length - 1 ? 1 : 0, borderBottomColor: t.line }}>
              <Txt variant="bodyStrong">{L.prayer(k)}</Txt>
              <Segmented<AlertKind>
                value={s.alerts[k]}
                onChange={(v) => s.set({ alerts: { ...s.alerts, [k]: v } })}
                options={[
                  { value: 'adhan', label: L.t('ps.adhan') },
                  { value: 'sound', label: L.t('ps.sound') },
                  { value: 'silent', label: L.t('ps.silent') },
                  { value: 'off', label: L.t('ps.off') },
                ]}
              />
            </View>
          ))}
        </ListGroup>
        <AdhanPreview />
        {/* Android 12+ may delay alerts unless the app is allowed to set exact alarms. */}
        {Platform.OS === 'android' && Number(Platform.Version) >= 31 && (
          <ListGroup footer={L.t('ps.exactFooter')}>
            <ListRow
              icon="clock"
              title={L.t('ps.exact')}
              onPress={() =>
                IntentLauncher.startActivityAsync('android.settings.REQUEST_SCHEDULE_EXACT_ALARM', {
                  data: `package:${Constants.expoConfig?.android?.package ?? ''}`,
                }).catch(() => {})
              }
              last
            />
          </ListGroup>
        )}
        <ListGroup>
          <View style={{ gap: 8, paddingVertical: 12 }}>
            <Txt variant="bodyStrong">{L.t('ps.reminder')}</Txt>
            <Segmented
              value={String(s.reminderBefore)}
              onChange={(v) => s.set({ reminderBefore: Number(v) })}
              options={[
                { value: '0', label: L.t('ps.none') },
                { value: '10', label: L.t('common.minutes', { n: 10 }) },
                { value: '15', label: L.t('common.minutes', { n: 15 }) },
                { value: '30', label: L.t('common.minutes', { n: 30 }) },
              ]}
            />
          </View>
        </ListGroup>
      </View>

      <Press
        onPress={() => s.set({ method: localMethod, madhab: localMadhab, highLatitude: 'auto', adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 } })}
        accessibilityRole="button"
        style={{ alignSelf: 'center', padding: 8 }}
      >
        <Txt variant="caption" tone="soft">
          {L.t('ps.reset', { country: s.location.country || L.t('ps.thisPlace') })}
        </Txt>
      </Press>
    </Screen>
  );
}
