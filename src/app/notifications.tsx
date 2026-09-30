import { useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { addDays, dayKey } from '@/lib/dates';
import { useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { hadithOfTheDay } from '@/features/hadith/daily';
import { ALERT_ICON, ALERT_LABEL, NEXT_ALERT } from '@/features/prayer/alertCycle';
import { alertsSupported, hasAlertPermission } from '@/features/prayer/notifications';
import { PRAYERS, prayerTimesFor, type PrayerKey } from '@/features/prayer/times';
import { useSchedule } from '@/features/prayer/useSchedule';
import { ramadanInfo } from '@/features/ramadan/calendar';
import { useRamadan } from '@/features/ramadan/store';
import { MILESTONES } from '@/features/rewards/milestones';
import { useRewards } from '@/features/rewards/store';
import { useSettings } from '@/features/settings/store';
import { useTheme } from '@/theme/useTheme';

const UPCOMING = 5;

/** The bell on Home: the alerts coming up (tap to change one) and what's new today. */
export default function NotificationsScreen() {
  const t = useTheme();
  const L = useT();
  const { now, loc, prefs, hijriOffset, schedule } = useSchedule(30_000);
  const alerts = useSettings((s) => s.alerts);
  const set = useSettings((s) => s.set);
  const unseen = useRewards((s) => s.unseen);
  const margin = useRamadan((s) => s.sehriMargin);
  const [permission, setPermission] = useState<boolean | null>(null);

  // Opening the page clears the dot on the bell.
  useEffect(() => {
    set({ notificationsSeenAt: Date.now() });
  }, [set]);
  useEffect(() => {
    if (alertsSupported) hasAlertPermission().then(setPermission).catch(() => setPermission(null));
  }, []);

  // The next few prayers, from now into tomorrow.
  const upcoming = useMemo(() => {
    const out: { key: PrayerKey; at: Date; tomorrow: boolean }[] = [];
    const tomorrow = prayerTimesFor(loc, addDays(schedule.day, 1), prefs, hijriOffset);
    for (const [times, isTomorrow] of [
      [schedule.times, false],
      [tomorrow, true],
    ] as const) {
      for (const p of PRAYERS) if (times[p.key] > now && out.length < UPCOMING) out.push({ key: p.key, at: times[p.key], tomorrow: isTomorrow });
    }
    return out;
  }, [loc, prefs, hijriOffset, schedule, now]);

  const hadith = hadithOfTheDay(dayKey(schedule.day));
  const ramadan = useMemo(() => ramadanInfo(schedule.day, loc, prefs, hijriOffset, margin), [schedule.day, loc, prefs, hijriOffset, margin]);
  const milestone = MILESTONES.find((m) => m.id === unseen[0]);

  return (
    <Screen gap={18}>
      <ScreenHeader title={L.t('notif.pageTitle')} subtitle={L.t('notif.subtitle')} />

      {permission === false && (
        <Reveal index={0}>
          <Glass strong radius={24} padding={16} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Icon name="bellOff" size={22} color={t.text} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="title">{L.t('notif.offTitle')}</Txt>
              <Txt variant="caption" tone="muted">
                {L.t('notif.offBody')}
              </Txt>
            </View>
            <IconButton icon="chevronRight" label={L.t('settings.reliability')} size={38} onPress={() => router.push('/settings/reliability')} />
          </Glass>
        </Reveal>
      )}

      <Reveal index={1}>
        <ListGroup title={L.t('notif.upcoming')} footer={L.t('notif.upcomingNote')}>
          {upcoming.map((u, i) => {
            const kind = alerts[u.key];
            return (
              <ListRow
                key={`${u.key}-${u.tomorrow}`}
                title={L.prayer(u.key, u.tomorrow ? addDays(schedule.day, 1) : schedule.day)}
                subtitle={`${u.tomorrow ? `${L.t('notif.tomorrow')} · ` : ''}${L.clockFull(u.at, loc.timeZone)} · ${L.t(ALERT_LABEL[kind])}`}
                right={
                  <IconButton
                    icon={ALERT_ICON[kind]}
                    label={`${L.prayer(u.key)}: ${L.t(ALERT_LABEL[kind])}`}
                    size={38}
                    onPress={() => {
                      set({ alerts: { ...alerts, [u.key]: NEXT_ALERT[kind] } });
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                    }}
                  />
                }
                last={i === upcoming.length - 1}
              />
            );
          })}
        </ListGroup>
      </Reveal>

      <Reveal index={2}>
        <ListGroup title={L.t('notif.today')}>
          {milestone && <ListRow icon={milestone.icon} title={L.t('ms.newTitle')} subtitle={L.t(`ms.${milestone.id}` as Key)} onPress={() => router.push('/milestones')} />}
          <ListRow icon="scroll" title={L.t('hadith.today')} subtitle={(L.lang === 'bn' ? hadith.bn : hadith.en).slice(0, 90) + '…'} onPress={() => router.push('/hadith')} />
          {(ramadan.inRamadan || ramadan.daysUntil <= 60) && (
            <ListRow
              icon="moonStar"
              title={L.t('ramadan.title')}
              subtitle={ramadan.inRamadan ? L.t('notif.ramadanNow') : L.t('ramadan.homeCountdown', { n: ramadan.daysUntil })}
              onPress={() => router.push('/ramadan')}
            />
          )}
          <ListRow icon="sliders" title={L.t('settings.calcAlerts')} subtitle={L.t('notif.settingsSub')} onPress={() => router.push('/settings/prayer')} last />
        </ListGroup>
      </Reveal>
    </Screen>
  );
}
