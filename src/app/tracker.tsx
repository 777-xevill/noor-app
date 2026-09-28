import { useState } from 'react';
import { Platform, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Press } from '@/components/Press';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { type DayParts, dayKey, daysBetween, daysInMonth } from '@/lib/dates';
import { useT } from '@/i18n';
import { type FastState, useFasting } from '@/features/fasting/store';
import { usePrayerLog } from '@/features/prayer/log';
import { PRAYER_ICON } from '@/features/prayer/PrayerIcon';
import { PRAYERS, type PrayerKey } from '@/features/prayer/times';
import { useSchedule } from '@/features/prayer/useSchedule';
import { useTheme } from '@/theme/useTheme';

type Mode = 'prayers' | 'fasting';
const EMPTY: PrayerKey[] = [];

export default function TrackerScreen() {
  const t = useTheme();
  const L = useT();
  const { schedule, hijriOffset } = useSchedule(60_000);
  const today = schedule.day;
  const [mode, setMode] = useState<Mode>('prayers');
  const [view, setView] = useState({ y: today.y, m: today.m });
  const [selected, setSelected] = useState<DayParts>(today);
  const prayerDays = usePrayerLog((s) => s.days);
  const togglePrayer = usePrayerLog((s) => s.toggle);
  const fasts = useFasting((s) => s.days);
  const setFast = useFasting((s) => s.setDay);

  const selKey = dayKey(selected);
  const selDone = prayerDays[selKey] ?? EMPTY;
  const isFuture = daysBetween(today, selected) > 0;

  // Month summary (only days up to today count toward the total).
  let kept = 0;
  let possible = 0;
  let fasted = 0;
  let missed = 0;
  for (let d = 1; d <= daysInMonth(view.y, view.m); d++) {
    const day = { y: view.y, m: view.m, d };
    if (daysBetween(today, day) > 0) break;
    const k = dayKey(day);
    kept += prayerDays[k]?.length ?? 0;
    possible += 5;
    if (fasts[k] === 'fasted') fasted++;
    if (fasts[k] === 'missed') missed++;
  }

  const changeMonth = (delta: number) =>
    setView((v) => {
      const m = v.m + delta;
      return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });

  return (
    <Screen gap={16}>
      <ScreenHeader title={L.t('tracker.title')} subtitle={L.t('tracker.subtitle')} />
      <Segmented<Mode>
        value={mode}
        onChange={setMode}
        options={[
          { value: 'prayers', label: L.t('tracker.prayers') },
          { value: 'fasting', label: L.t('tracker.fasting') },
        ]}
      />

      <Glass radius={22} padding={14} style={{ flexDirection: 'row', gap: 12 }}>
        {mode === 'prayers' ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <ProgressRing size={40} stroke={4} progress={possible ? kept / possible : 0} color={t.ink} track={t.track} />
            <View>
              <Txt variant="title" tabular>
                {L.t('tracker.kept', { kept, possible })}
              </Txt>
              <Txt variant="caption" tone="muted">
                {L.t('tracker.markedMonth')}
              </Txt>
            </View>
          </View>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <Txt variant="h2" tabular>
                {L.num(fasted)}
              </Txt>
              <Txt variant="caption" tone="muted">
                {L.t('tracker.daysFasted')}
              </Txt>
            </View>
            <View style={{ width: 1, backgroundColor: t.line }} />
            <View style={{ flex: 1 }}>
              <Txt variant="h2" tabular>
                {L.num(missed)}
              </Txt>
              <Txt variant="caption" tone="muted">
                {L.t('tracker.qada')}
              </Txt>
            </View>
          </>
        )}
      </Glass>

      <MonthCalendar
        year={view.y}
        month={view.m}
        today={today}
        selected={selected}
        hijriOffset={hijriOffset}
        onSelect={setSelected}
        onMonthChange={changeMonth}
        renderMark={(day) => {
          const k = dayKey(day);
          if (daysBetween(today, day) > 0) return null;
          if (mode === 'prayers') return <ProgressRing size={14} stroke={2} progress={(prayerDays[k]?.length ?? 0) / 5} color={t.ink} track={t.track} />;
          const f = fasts[k];
          return f ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: f === 'fasted' ? t.ink : 'transparent', borderWidth: 1.5, borderColor: t.ink }} /> : null;
        }}
      />

      <Glass radius={26} padding={16} style={{ gap: 12 }}>
        <Txt variant="title">{L.longDate(selected)}</Txt>
        {isFuture ? (
          <Txt variant="body" tone="muted">
            {L.t('tracker.future')}
          </Txt>
        ) : mode === 'prayers' ? (
          PRAYERS.map(({ key }) => {
            const done = selDone.includes(key);
            return (
              <Press
                key={key}
                scaleTo={0.98}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  togglePrayer(selKey, key);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}
              >
                <Icon name={PRAYER_ICON[key]} size={18} color={t.textSoft} />
                <Txt variant="bodyStrong" style={{ flex: 1 }}>
                  {L.prayer(key, selected)}
                </Txt>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: done ? t.ink : 'transparent',
                    borderWidth: done ? 0 : 1.5,
                    borderColor: t.lineStrong,
                  }}
                >
                  {done && <Icon name="check" size={15} color={t.onInk} strokeWidth={2.6} />}
                </View>
              </Press>
            );
          })
        ) : (
          <Segmented<FastState | 'none'>
            value={fasts[selKey] ?? 'none'}
            onChange={(v) => setFast(selKey, v === 'none' ? null : v)}
            options={[
              { value: 'none', label: L.t('fast.none') },
              { value: 'fasted', label: L.t('fast.fasted') },
              { value: 'missed', label: L.t('fast.missed') },
            ]}
          />
        )}
      </Glass>
    </Screen>
  );
}
