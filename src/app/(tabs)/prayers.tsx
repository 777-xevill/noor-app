import { useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { addDays, dayKey, daysBetween, formatClock, formatCountdown, monthName, sameDay, weekdayName } from '@/lib/dates';
import { formatHijri, toHijri } from '@/lib/hijri';
import { METHOD_LABEL } from '@/features/prayer/location';
import { usePrayerLog } from '@/features/prayer/log';
import { PRAYER_ICON } from '@/features/prayer/PrayerIcon';
import { prayerLabel, PRAYERS, prayerTimesFor, type PrayerKey } from '@/features/prayer/times';
import { useSchedule } from '@/features/prayer/useSchedule';
import { type AlertKind, useSettings } from '@/features/settings/store';
import { useTheme } from '@/theme/useTheme';

const EMPTY: PrayerKey[] = [];
const NEXT_ALERT: Record<AlertKind, AlertKind> = { sound: 'silent', silent: 'off', off: 'sound' };
const ALERT_ICON: Record<AlertKind, IconName> = { sound: 'bellRing', silent: 'bell', off: 'bellOff' };
const ALERT_LABEL: Record<AlertKind, string> = { sound: 'Alert with sound', silent: 'Silent alert', off: 'No alert' };

export default function PrayersScreen() {
  const t = useTheme();
  const { now, loc, prefs, hijriOffset, schedule } = useSchedule();
  const [offset, setOffset] = useState(0); // days from today
  const day = addDays(schedule.day, offset);
  const isToday = offset === 0;
  // Computing a day's times takes microseconds, so no memo is needed.
  const times = isToday ? schedule.times : prayerTimesFor(loc, day, prefs, hijriOffset);
  const key = dayKey(day);
  const done = usePrayerLog((s) => s.days[key] ?? EMPTY);
  const toggle = usePrayerLog((s) => s.toggle);
  const alerts = useSettings((s) => s.alerts);
  const setSettings = useSettings((s) => s.set);
  const future = daysBetween(schedule.day, day) > 0;

  const rows: { key: PrayerKey | 'sunrise'; label: string }[] = [
    { key: 'fajr', label: 'Fajr' },
    { key: 'sunrise', label: 'Sunrise' },
    ...PRAYERS.slice(1).map((p) => ({ key: p.key, label: prayerLabel(p.key, day) })),
  ];

  return (
    <Screen tabs gap={18}>
      <Reveal index={0}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <Txt variant="h1">Prayers</Txt>
          <IconButton icon="settings" label="Prayer settings" onPress={() => router.push('/settings/prayer')} />
        </View>
      </Reveal>

      <Reveal index={1}>
        <Glass radius={24} padding={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconButton icon="chevronLeft" label="Previous day" size={40} onPress={() => setOffset((o) => o - 1)} />
          <Press style={{ flex: 1, alignItems: 'center' }} onPress={() => setOffset(0)} accessibilityRole="button" accessibilityLabel="Go to today">
            <Txt variant="title">
              {isToday ? 'Today' : weekdayName(day)}, {day.d} {monthName(day)}
            </Txt>
            <Txt variant="caption" tone="muted">
              {formatHijri(toHijri(day, hijriOffset))} AH
            </Txt>
          </Press>
          <IconButton icon="chevronRight" label="Next day" size={40} onPress={() => setOffset((o) => o + 1)} />
        </Glass>
      </Reveal>

      <Reveal index={2}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Press onPress={() => router.push('/settings/location')} accessibilityRole="button" accessibilityLabel="Change location">
            <Chip icon="mapPin" label={`${loc.city}, ${loc.country}`} />
          </Press>
          <Press onPress={() => router.push('/settings/prayer')} accessibilityRole="button" accessibilityLabel="Change calculation method">
            <Chip icon="sliders" label={`${METHOD_LABEL[prefs.method]} · ${prefs.madhab} Asr`} />
          </Press>
        </View>
      </Reveal>

      {isToday && (
        <Reveal index={3}>
          <Glass strong radius={26} padding={18} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={PRAYER_ICON[schedule.next.key]} size={24} color={t.onInk} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="eyebrow" tone="muted">
                {schedule.next.tomorrow ? 'Next · tomorrow' : 'Next prayer'}
              </Txt>
              <Txt variant="h2">
                {prayerLabel(schedule.next.key, schedule.next.tomorrow ? addDays(schedule.day, 1) : schedule.day)} at{' '}
                {formatClock(schedule.next.at, loc.timeZone).hm} {formatClock(schedule.next.at, loc.timeZone).period}
              </Txt>
            </View>
            <Txt variant="title" tabular>
              {formatCountdown(schedule.next.at.getTime() - now.getTime())}
            </Txt>
          </Glass>
        </Reveal>
      )}

      <Reveal index={4}>
        <Glass radius={26} padding={8}>
          {rows.map((row, i) => {
            const c = formatClock(times[row.key], loc.timeZone);
            const isPrayer = row.key !== 'sunrise';
            const pk = row.key as PrayerKey;
            const isNext = isToday && !schedule.next.tomorrow && schedule.next.key === row.key;
            const started = !future && (!isToday || times[row.key].getTime() <= now.getTime());
            const isDone = isPrayer && done.includes(pk);
            const alert = isPrayer ? alerts[pk] : 'off';
            const fg = isNext ? t.onInk : t.text;
            return (
              <View
                key={row.key}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 12,
                  paddingVertical: isPrayer ? 12 : 9,
                  borderRadius: 18,
                  backgroundColor: isNext ? t.ink : 'transparent',
                  borderBottomWidth: i < rows.length - 1 && !isNext ? 1 : 0,
                  borderBottomColor: t.line,
                }}
              >
                {isPrayer ? (
                  <Press
                    disabled={!started}
                    scaleTo={0.85}
                    hitSlop={8}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isDone, disabled: !started }}
                    accessibilityLabel={`Mark ${row.label} as prayed`}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggle(key, pk);
                    }}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: started ? 1 : 0.4,
                      backgroundColor: isDone ? (isNext ? t.onInk : t.ink) : 'transparent',
                      borderWidth: isDone ? 0 : 1.5,
                      borderColor: isNext ? `${t.onInk}80` : t.lineStrong,
                    }}
                  >
                    {isDone && <Icon name="check" size={15} color={isNext ? t.ink : t.onInk} strokeWidth={2.6} />}
                  </Press>
                ) : (
                  <View style={{ width: 26 }} />
                )}
                <Icon name={PRAYER_ICON[row.key]} size={18} color={isNext ? t.onInk : t.textSoft} />
                <Txt variant={isPrayer ? 'title' : 'body'} color={isPrayer ? fg : t.textMuted} style={{ flex: 1 }}>
                  {row.label}
                </Txt>
                <Txt variant={isPrayer ? 'title' : 'body'} color={isPrayer ? fg : t.textMuted} tabular>
                  {c.hm}{' '}
                  <Txt variant="caption" color={isNext ? t.onInk : t.textMuted}>
                    {c.period}
                  </Txt>
                </Txt>
                {isPrayer ? (
                  <Press
                    hitSlop={8}
                    scaleTo={0.82}
                    accessibilityRole="button"
                    accessibilityLabel={`${row.label}: ${ALERT_LABEL[alert]}. Tap to change.`}
                    onPress={() => setSettings({ alerts: { ...alerts, [pk]: NEXT_ALERT[alert] } })}
                    style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isNext ? `${t.onInk}1F` : t.pill }}
                  >
                    <Icon name={ALERT_ICON[alert]} size={16} color={isNext ? t.onInk : alert === 'off' ? t.textMuted : t.text} />
                  </Press>
                ) : (
                  <View style={{ width: 34 }} />
                )}
              </View>
            );
          })}
        </Glass>
      </Reveal>

      <Reveal index={5}>
        <Glass radius={22} padding={14} style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="micro" tone="muted">
              Middle of the night
            </Txt>
            <Txt variant="title" tabular>
              {formatClock(times.midnight, loc.timeZone).hm} {formatClock(times.midnight, loc.timeZone).period}
            </Txt>
          </View>
          <View style={{ width: 1, backgroundColor: t.line }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="micro" tone="muted">
              Last third begins (Tahajjud)
            </Txt>
            <Txt variant="title" tabular>
              {formatClock(times.lastThird, loc.timeZone).hm} {formatClock(times.lastThird, loc.timeZone).period}
            </Txt>
          </View>
        </Glass>
      </Reveal>

      <Reveal index={6}>
        <ListGroup>
          <ListRow icon="calendarRange" title="Prayer tracker" subtitle="Month view of prayers and fasts" onPress={() => router.push('/tracker')} />
          <ListRow icon="table" title="Monthly timetable" subtitle={`All times for ${monthName(day)}`} onPress={() => router.push('/timetable')} />
          <ListRow icon="compass" title="Qibla direction" onPress={() => router.push('/qibla')} />
          <ListRow icon="settings" title="Prayer settings" subtitle="Location, method, alerts, adjustments" onPress={() => router.push('/settings/prayer')} last />
        </ListGroup>
      </Reveal>

      {!isToday && !sameDay(day, schedule.day) && (
        <Press onPress={() => setOffset(0)} style={{ alignSelf: 'center' }} accessibilityRole="button">
          <Chip variant="ink" label="Back to today" />
        </Press>
      )}
    </Screen>
  );
}
