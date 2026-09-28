import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/Icon';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Press } from '@/components/Press';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { formatHijri, toHijri } from '@/lib/hijri';
import { METHODS, suggestedMadhab, suggestedMethod } from '@/features/prayer/location';
import { alertsSupported, requestAlertPermission } from '@/features/prayer/notifications';
import { useSchedule } from '@/features/prayer/useSchedule';
import { type AdjustableTime, type AlertKind, type AlertPrayer, type HighLatitude, useSettings } from '@/features/settings/store';
import { useTheme } from '@/theme/useTheme';

const ADJUSTABLE: { key: AdjustableTime; label: string }[] = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'sunrise', label: 'Sunrise' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
];
const ALERT_PRAYERS: { key: AlertPrayer; label: string }[] = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
];
const signed = (v: number) => (v === 0 ? '0 min' : `${v > 0 ? '+' : '−'}${Math.abs(v)} min`);

export default function PrayerSettingsScreen() {
  const t = useTheme();
  const s = useSettings();
  const { schedule } = useSchedule(60_000);
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const localMethod = suggestedMethod(s.location.cc);
  const localMadhab = suggestedMadhab(s.location.cc);

  return (
    <Screen gap={20}>
      <ScreenHeader title="Prayer settings" subtitle={`${s.location.city}${s.location.country ? `, ${s.location.country}` : ''}`} />

      <ListGroup title="Location">
        <ListRow icon="mapPin" title={s.location.city} subtitle={s.location.source === 'gps' ? 'From your device' : 'Chosen from list'} onPress={() => router.push('/settings/location')} last />
      </ListGroup>

      <ListGroup
        title="Calculation method"
        footer={`Usually used in ${s.location.country || 'your area'}: ${METHODS.find((m) => m.key === localMethod)?.label}. Follow your local mosque if it differs.`}
      >
        {METHODS.map((m, i) => (
          <ListRow
            key={m.key}
            title={m.label}
            subtitle={m.detail}
            onPress={() => s.set({ method: m.key })}
            right={s.method === m.key ? <Icon name="check" size={18} color={t.text} strokeWidth={2.4} /> : <View style={{ width: 18 }} />}
            last={i === METHODS.length - 1}
          />
        ))}
      </ListGroup>

      <View style={{ gap: 8 }}>
        <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
          Asr time
        </Txt>
        <Segmented
          value={s.madhab}
          onChange={(madhab) => s.set({ madhab })}
          options={[
            { value: 'Shafi', label: 'Standard' },
            { value: 'Hanafi', label: 'Hanafi' },
          ]}
        />
        <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
          Standard (Shafi’i, Maliki, Hanbali): Asr begins when an object’s shadow equals its height, plus its shadow at noon. Hanafi: when the shadow is twice its height, so Asr is later. Common here: {localMadhab === 'Hanafi' ? 'Hanafi' : 'Standard'}.
        </Txt>
      </View>

      <View style={{ gap: 8 }}>
        <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
          High-latitude rule
        </Txt>
        <Segmented<HighLatitude>
          value={s.highLatitude}
          onChange={(highLatitude) => s.set({ highLatitude })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'middleOfTheNight', label: 'Middle' },
            { value: 'seventhOfTheNight', label: '1/7 night' },
            { value: 'twilightAngle', label: 'Angle' },
          ]}
        />
        <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
          Only matters far from the equator (e.g. UK summer), when twilight never fully ends. Auto uses the recommended rule for your latitude.
        </Txt>
      </View>

      <ListGroup title="Adjust to your mosque" footer="Add or remove minutes from a calculated time, e.g. to match your local mosque’s timetable.">
        {ADJUSTABLE.map((a, i) => (
          <ListRow
            key={a.key}
            title={a.label}
            right={
              <Stepper
                label={`${a.label} adjustment`}
                value={s.adjustments[a.key]}
                min={-30}
                max={30}
                format={signed}
                onChange={(v) => s.set({ adjustments: { ...s.adjustments, [a.key]: v } })}
              />
            }
            last={i === ADJUSTABLE.length - 1}
          />
        ))}
      </ListGroup>

      <ListGroup
        title="Hijri date"
        footer="Hijri dates follow the Umm al-Qura calendar. Months often start a day later in Bangladesh and South Asia; adjust to match your local moon-sighting announcement."
      >
        <ListRow
          title={`${formatHijri(toHijri(schedule.day, s.hijriOffset))} AH`}
          subtitle="Today"
          right={<Stepper label="Hijri adjustment" value={s.hijriOffset} min={-2} max={2} format={(v) => (v === 0 ? '0 days' : `${v > 0 ? '+' : '−'}${Math.abs(v)} day${Math.abs(v) > 1 ? 's' : ''}`)} onChange={(v) => s.set({ hijriOffset: v })} />}
          last
        />
      </ListGroup>

      <View style={{ gap: 8 }}>
        <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
          Alerts
        </Txt>
        {!alertsSupported ? (
          <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
            Prayer alerts work in the phone app. Your choices here are saved and used there.
          </Txt>
        ) : permission !== 'granted' ? (
          <Press
            onPress={async () => setPermission((await requestAlertPermission()) ? 'granted' : 'denied')}
            accessibilityRole="button"
            style={{ paddingHorizontal: 6 }}
          >
            <Txt variant="caption" tone="soft">
              {permission === 'denied' ? 'Notifications are turned off for Noor. Turn them on in your phone’s Settings to get prayer alerts.' : 'Tap to allow notifications for prayer alerts.'}
            </Txt>
          </Press>
        ) : null}
        <ListGroup>
          {ALERT_PRAYERS.map((p, i) => (
            <View key={p.key} style={{ gap: 8, paddingVertical: 12, borderBottomWidth: i < ALERT_PRAYERS.length - 1 ? 1 : 0, borderBottomColor: t.line }}>
              <Txt variant="bodyStrong">{p.label}</Txt>
              <Segmented<AlertKind>
                value={s.alerts[p.key]}
                onChange={(v) => s.set({ alerts: { ...s.alerts, [p.key]: v } })}
                options={[
                  { value: 'sound', label: 'Sound' },
                  { value: 'silent', label: 'Silent' },
                  { value: 'off', label: 'Off' },
                ]}
              />
            </View>
          ))}
        </ListGroup>
        <ListGroup>
          <View style={{ gap: 8, paddingVertical: 12 }}>
            <Txt variant="bodyStrong">Reminder before each prayer</Txt>
            <Segmented
              value={String(s.reminderBefore)}
              onChange={(v) => s.set({ reminderBefore: Number(v) })}
              options={[
                { value: '0', label: 'None' },
                { value: '10', label: '10 min' },
                { value: '15', label: '15 min' },
                { value: '30', label: '30 min' },
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
          Reset to the usual settings for {s.location.country || 'this place'}
        </Txt>
      </Press>
    </Screen>
  );
}
