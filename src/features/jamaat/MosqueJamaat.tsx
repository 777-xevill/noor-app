import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Press } from '@/components/Press';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { type I18n, useT } from '@/i18n';
import { placeName } from '@/features/places/format';
import type { Place } from '@/features/places/overpass';
import { useSyncMeta } from '@/features/sync/store';
import { useTheme } from '@/theme/useTheme';
import { JamaatEditor } from './JamaatEditor';
import { type SharedJamaat, confirmTimes, fetchShared, jamaatSharingEnabled, reportTimes, shareTimes } from './api';
import { JAMAAT_PRAYERS, type JamaatRule, type JamaatTimes, hasAnyTime } from './rules';
import { useJamaat } from './store';

export const ruleLabel = (L: I18n, r: JamaatRule) => (r.kind === 'fixed' ? L.num(r.at) : L.t('jamaat.afterN', { n: L.num(r.minutes) }));

function TimesList({ L, times }: { L: I18n; times: JamaatTimes }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {JAMAAT_PRAYERS.filter((p) => times[p]).map((p) => (
        <View key={p} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: t.line }}>
          <Txt variant="body" tone="soft">
            {L.prayer(p)}
          </Txt>
          <Txt variant="bodyStrong" tabular>
            {ruleLabel(L, times[p]!)}
          </Txt>
        </View>
      ))}
    </View>
  );
}

function Button({ label, onPress, ink }: { label: string; onPress: () => void; ink?: boolean }) {
  const t = useTheme();
  return (
    <Press onPress={onPress} scaleTo={0.97} accessibilityRole="button">
      <View style={{ height: 46, borderRadius: 23, backgroundColor: ink ? t.ink : t.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
        <Txt variant="bodyStrong" tone={ink ? 'onInk' : undefined}>
          {label}
        </Txt>
      </View>
    </Press>
  );
}

const ALERT_OPTIONS = [0, 5, 10, 15, 30];

/** Follow a mosque from the nearby list and keep its jamaat times, typed here or shared by others. */
export function MosqueJamaat({ place }: { place: Place }) {
  const L = useT();
  const mosque = useJamaat((s) => s.mosque);
  const alertBefore = useJamaat((s) => s.alertBefore);
  const { follow, unfollow, setTimes, setAlertBefore } = useJamaat.getState();
  const signedIn = useSyncMeta((m) => !!m.email);
  const followed = mosque?.id === place.id;
  const name = placeName(L, place);
  const [editing, setEditing] = useState(false);
  const [shared, setShared] = useState<SharedJamaat | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!jamaatSharingEnabled) return;
    let alive = true;
    fetchShared(place.id).then(
      (s) => alive && setShared(s),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [place.id]);

  const start = (times?: JamaatTimes, source?: 'me' | 'shared') => follow({ id: place.id, name, lat: place.lat, lng: place.lng, times, source });
  const fail = (e: unknown) => setNote(L.t(String((e as Error)?.message).includes('locked') ? 'jamaat.locked' : 'jamaat.shareError'));

  if (editing) {
    return (
      <JamaatEditor
        initial={followed ? mosque.times : {}}
        onSave={(times) => {
          if (followed) setTimes(times, 'me');
          else start(times, 'me');
          setEditing(false);
        }}
      />
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {followed ? (
        <>
          {hasAnyTime(mosque.times) ? (
            <>
              <Txt variant="eyebrow" tone="muted">
                {L.t('jamaat.times')}
              </Txt>
              <TimesList L={L} times={mosque.times} />
              <Txt variant="micro" tone="muted">
                {L.t(mosque.source === 'shared' ? 'jamaat.fromShared' : 'jamaat.fromYou')}
              </Txt>
            </>
          ) : (
            <Txt variant="body" tone="soft">
              {L.t('jamaat.noTimes')}
            </Txt>
          )}
          <Button label={L.t(hasAnyTime(mosque.times) ? 'jamaat.edit' : 'jamaat.add')} onPress={() => setEditing(true)} ink={!hasAnyTime(mosque.times)} />
          {hasAnyTime(mosque.times) && (
            <View style={{ gap: 6 }}>
              <Txt variant="caption" tone="muted">
                {L.t('jamaat.alertBefore')}
              </Txt>
              <Segmented<string>
                value={String(alertBefore)}
                onChange={(v) => setAlertBefore(Number(v))}
                options={ALERT_OPTIONS.map((m) => ({ value: String(m), label: m === 0 ? L.t('ps.off') : L.t('common.minutes', { n: L.num(m) }) }))}
              />
            </View>
          )}
          {jamaatSharingEnabled && hasAnyTime(mosque.times) && mosque.source === 'me' && (
            <Button
              label={L.t(signedIn ? 'jamaat.share' : 'jamaat.signInShare')}
              onPress={() => {
                if (!signedIn) return router.push('/settings/account');
                shareTimes(place.id, name, mosque.times).then(() => setNote(L.t('jamaat.shared')), fail);
              }}
            />
          )}
          <Button label={L.t('jamaat.unfollow')} onPress={unfollow} />
        </>
      ) : (
        <>
          <Button label={L.t('jamaat.follow')} onPress={() => start()} ink />
          <Txt variant="micro" tone="muted">
            {L.t('jamaat.followNote')}
          </Txt>
        </>
      )}

      {shared && !(followed && mosque.source === 'shared') && (
        <View style={{ gap: 8, paddingTop: 8 }}>
          <Txt variant="eyebrow" tone="muted">
            {L.t('jamaat.sharedTimes')}
          </Txt>
          <TimesList L={L} times={shared.times} />
          <Txt variant="micro" tone="muted">
            {L.t('jamaat.unverified', { n: L.num(shared.confirmations) })}
          </Txt>
          <Button
            label={L.t('jamaat.useThese')}
            onPress={() => (followed ? setTimes(shared.times, 'shared') : start(shared.times, 'shared'))}
          />
          {signedIn && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button label={L.t('jamaat.confirm')} onPress={() => confirmTimes(place.id).then(() => setNote(L.t('jamaat.thanks')), fail)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label={L.t('jamaat.report')} onPress={() => reportTimes(place.id).then(() => setNote(L.t('jamaat.thanks')), fail)} />
              </View>
            </View>
          )}
        </View>
      )}

      {note ? (
        <Txt variant="caption" tone="soft">
          {note}
        </Txt>
      ) : null}
    </View>
  );
}
