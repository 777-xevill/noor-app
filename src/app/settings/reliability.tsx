import { useCallback, useState } from 'react';
import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import * as IntentLauncher from 'expo-intent-launcher';
import { useFocusEffect } from 'expo-router';
import { Icon } from '@/components/Icon';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import { alertsSupported, hasAlertPermission, pendingAlertCount, requestAlertPermission, reschedulePrayerAlerts } from '@/features/prayer/notifications';
import { useTheme } from '@/theme/useTheme';

const androidPackage = Constants.expoConfig?.android?.package ?? '';

export default function ReliabilityScreen() {
  const t = useTheme();
  const L = useT();
  const [notif, setNotif] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [pending, setPending] = useState<number | null>(null);
  const [working, setWorking] = useState(false);

  const refresh = useCallback(async () => {
    if (!alertsSupported) return;
    setNotif((await hasAlertPermission()) ? 'granted' : 'denied');
    setPending(await pendingAlertCount());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const fixNotifications = async () => {
    setWorking(true);
    const granted = await requestAlertPermission();
    setNotif(granted ? 'granted' : 'denied');
    if (granted) {
      await reschedulePrayerAlerts();
      setPending(await pendingAlertCount());
    }
    setWorking(false);
  };

  const fixSchedule = async () => {
    setWorking(true);
    await reschedulePrayerAlerts();
    setPending(await pendingAlertCount());
    setWorking(false);
  };

  const statusIcon = (ok: boolean) => <Icon name={ok ? 'circleCheck' : 'bellOff'} size={18} color={ok ? t.text : t.textMuted} />;

  const notifOk = notif === 'granted';
  const scheduleOk = (pending ?? 0) > 0;
  const allGood = alertsSupported && notifOk && scheduleOk;

  return (
    <Screen gap={20}>
      <ScreenHeader title={L.t('rel.title')} subtitle={L.t('rel.subtitle')} />

      {!alertsSupported ? (
        <ListGroup>
          <ListRow icon="info" title={L.t('ps.alertsWeb')} last />
        </ListGroup>
      ) : (
        <>
          <ListGroup footer={allGood ? L.t('rel.allGoodFooter') : undefined}>
            <ListRow
              icon="bellRing"
              title={L.t('rel.notif')}
              value={L.t(notifOk ? 'rel.on' : 'rel.off')}
              right={statusIcon(notifOk)}
              onPress={notifOk || working ? undefined : fixNotifications}
            />
            <ListRow
              icon="activity"
              title={L.t('rel.scheduled')}
              value={pending == null ? '—' : scheduleOk ? L.t('rel.scheduled.n', { n: L.num(pending) }) : L.t('rel.scheduled.none')}
              right={pending == null ? undefined : statusIcon(scheduleOk)}
              onPress={notifOk && !scheduleOk && !working ? fixSchedule : undefined}
              last
            />
          </ListGroup>

          {Platform.OS === 'android' && Number(Platform.Version) >= 31 && (
            <ListGroup footer={L.t('ps.exactFooter')}>
              <ListRow
                icon="clock"
                title={L.t('ps.exact')}
                onPress={() => IntentLauncher.startActivityAsync('android.settings.REQUEST_SCHEDULE_EXACT_ALARM', { data: `package:${androidPackage}` }).catch(() => {})}
                last
              />
            </ListGroup>
          )}

          {Platform.OS === 'android' && (
            <ListGroup footer={L.t('rel.batteryFooter')}>
              <ListRow
                icon="battery"
                title={L.t('rel.battery')}
                onPress={() => IntentLauncher.startActivityAsync('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS').catch(() => {})}
                last
              />
            </ListGroup>
          )}

          <View style={{ paddingHorizontal: 6 }}>
            <Txt variant="caption" tone="muted">
              {L.t('rel.footer')}
            </Txt>
          </View>
        </>
      )}
    </Screen>
  );
}
