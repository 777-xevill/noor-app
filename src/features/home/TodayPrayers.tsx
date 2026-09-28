import { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { Press } from '@/components/Press';
import { ProgressRing } from '@/components/ProgressRing';
import { Txt } from '@/components/Txt';
import { dayKey } from '@/lib/dates';
import { useT } from '@/i18n';
import { usePrayerLog } from '@/features/prayer/log';
import { PRAYERS, type PrayerKey } from '@/features/prayer/times';
import { useSchedule } from '@/features/prayer/useSchedule';
import { spring } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

const PRAYER_ICON: Record<PrayerKey, IconName> = {
  fajr: 'sunrise',
  dhuhr: 'sun',
  asr: 'cloudSun',
  maghrib: 'sunset',
  isha: 'moonStar',
};

const EMPTY: PrayerKey[] = [];

/** The tick circle. Marking or unmarking gives it a small spring "pop" so the tap feels acknowledged. */
function CheckMark({ done, started, inverted }: { done: boolean; started: boolean; inverted: boolean }) {
  const t = useTheme();
  const pop = useSharedValue(1);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) {
      pop.value = withSequence(withTiming(done ? 0.62 : 0.84, { duration: 80 }), withSpring(1, spring.bouncy));
    }
    mounted.current = true;
  }, [done, pop]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <Animated.View
      style={[
        {
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? (inverted ? t.onInk : t.ink) : 'transparent',
          borderWidth: done ? 0 : 1.5,
          borderStyle: started ? 'solid' : 'dashed',
          borderColor: inverted ? `${t.onInk}73` : t.lineStrong,
        },
        style,
      ]}
    >
      {done && <Icon name="check" size={14} color={inverted ? t.ink : t.onInk} strokeWidth={2.6} />}
    </Animated.View>
  );
}

export function TodayPrayers() {
  const t = useTheme();
  const L = useT();
  const { now, loc, schedule } = useSchedule();
  const key = dayKey(schedule.day);
  const done = usePrayerLog((s) => s.days[key] ?? EMPTY);
  const toggle = usePrayerLog((s) => s.toggle);

  return (
    <Glass padding={14} radius={26} style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <View>
          <Txt variant="title">{L.t('home.todaysPrayers')}</Txt>
          <Txt variant="caption" tone="muted">
            {L.t('home.tapToMark')}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt variant="bodyStrong" tabular>
            {L.num(done.length)}
            <Txt variant="bodyStrong" tone="muted">
              /{L.num(5)}
            </Txt>
          </Txt>
          <ProgressRing size={26} stroke={3} progress={done.length / 5} color={t.ink} track={t.track} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {PRAYERS.map(({ key: prayer }) => {
          const label = L.prayer(prayer, schedule.day);
          const started = schedule.times[prayer].getTime() <= now.getTime();
          const isCurrent = schedule.current === prayer;
          const isDone = done.includes(prayer);
          const fg = isCurrent ? t.onInk : t.text;
          const fgMuted = isCurrent ? t.onInk : t.textMuted;
          const clock = L.clock(schedule.times[prayer], loc.timeZone);

          return (
            <Press
              key={prayer}
              disabled={!started}
              scaleTo={0.93}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggle(key, prayer);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isDone, disabled: !started }}
              accessibilityLabel={`${label} at ${clock.hm} ${clock.period}`}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: 7,
                paddingTop: 12,
                paddingBottom: 10,
                borderRadius: 18,
                backgroundColor: isCurrent ? t.ink : 'transparent',
                opacity: started ? 1 : 0.5,
              }}
            >
              <Icon name={PRAYER_ICON[prayer]} size={19} color={fg} />
              <View style={{ alignItems: 'center' }}>
                <Txt variant="caption" color={fg} style={{ fontSize: 12 }}>
                  {label}
                </Txt>
                <Txt variant="micro" color={fgMuted} tabular>
                  {clock.hm}
                </Txt>
              </View>
              <CheckMark done={isDone} started={started} inverted={isCurrent} />
            </Press>
          );
        })}
      </View>
    </Glass>
  );
}
