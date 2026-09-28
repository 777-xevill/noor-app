import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { Press } from '@/components/Press';
import { ProgressRing } from '@/components/ProgressRing';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { Sheet } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { HADITH, type HadithId } from '@/data/hadith';
import { fromDayKey } from '@/lib/dates';
import { type I18n, useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { MILESTONE_GROUPS, type StreakKind } from '@/features/rewards/milestones';
import { useRewards } from '@/features/rewards/store';
import { type MilestoneState, useMilestones } from '@/features/rewards/useMilestones';
import { fonts } from '@/theme/fonts';
import { spring } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';

const STREAKS: { kind: StreakKind; icon: IconName }[] = [
  { kind: 'prayer', icon: 'mosque' },
  { kind: 'quran', icon: 'book' },
  { kind: 'dhikr', icon: 'tasbih' },
  { kind: 'journal', icon: 'journal' },
];

const grouped = (L: I18n, n: number) => L.num(n.toLocaleString('en-US'));

/** Earned: a filled ink disc. Not yet: a ring showing how far along it is. New ones arrive with a small pop. */
function Medallion({ m, size = 44, celebrate }: { m: MilestoneState; size?: number; celebrate?: boolean }) {
  const t = useTheme();
  const scale = useSharedValue(celebrate ? 0.6 : 1);
  useEffect(() => {
    if (celebrate) scale.value = withDelay(260, withSpring(1, spring.bouncy));
  }, [celebrate, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (m.done)
    return (
      <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.ink, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Icon name={m.icon} size={size * 0.45} color={t.onInk} />
      </Animated.View>
    );
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute' }}>
        <ProgressRing size={size} stroke={3} progress={m.value / m.target} color={t.text} track={t.track} />
      </View>
      <Icon name={m.icon} size={size * 0.42} color={t.textMuted} />
    </View>
  );
}

function StreakTile({ kind, icon, current, best }: { kind: StreakKind; icon: IconName; current: number; best: number }) {
  const t = useTheme();
  const L = useT();
  // The flame breathes once when a streak is alive — a quiet acknowledgement, not a fireworks show.
  const flame = useSharedValue(1);
  useEffect(() => {
    if (current > 0) flame.value = withDelay(500, withSequence(withTiming(1.18, { duration: 260 }), withSpring(1, spring.bouncy)));
  }, [current, flame]);
  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: flame.value }] }));

  return (
    <Glass radius={24} padding={16} style={{ flex: 1, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: t.pill, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={18} color={t.text} />
        </View>
        {current > 0 && (
          <Animated.View style={flameStyle}>
            <Icon name="flame" size={18} color={t.text} />
          </Animated.View>
        )}
      </View>
      <View>
        <Txt tabular style={{ fontFamily: fonts.semibold, fontSize: 34, lineHeight: 40, letterSpacing: L.lang === 'en' ? -1.2 : 0 }} tone={current ? 'default' : 'muted'}>
          {L.num(current)}
        </Txt>
        <Txt variant="caption" tone="muted">
          {L.t('ms.days')}
        </Txt>
      </View>
      <View style={{ gap: 2 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {L.t(`ms.streak.${kind}` as Key)}
        </Txt>
        <Txt variant="micro" tone="muted" tabular>
          {L.t('ms.best', { n: best })}
        </Txt>
      </View>
    </Glass>
  );
}

function HadithBlock({ id, eyebrow }: { id: HadithId; eyebrow?: boolean }) {
  const L = useT();
  const h = HADITH.find((x) => x.id === id)!;
  return (
    <View style={{ gap: 10 }}>
      {eyebrow && (
        <Txt variant="eyebrow" tone="muted">
          {L.t('ms.fromSunnah')}
        </Txt>
      )}
      {h.ar ? (
        <Txt variant="arabic" style={{ fontSize: 22, lineHeight: 44 }}>
          {h.ar}
        </Txt>
      ) : null}
      <Txt variant="body" tone="soft" style={{ fontSize: 16, lineHeight: 24 }}>
        {L.lang === 'bn' ? h.bn : h.en}
      </Txt>
      <Txt variant="caption" tone="muted">
        {L.lang === 'bn' ? L.num(h.ref.replace('Sahih Muslim', 'সহিহ মুসলিম')) : h.ref}
      </Txt>
    </View>
  );
}

export default function MilestonesScreen() {
  const t = useTheme();
  const L = useT();
  const { stats, milestones } = useMilestones();
  const markSeen = useRewards((s) => s.markSeen);
  const [open, setOpen] = useState<MilestoneState | null>(null);

  // "New" stays visible while you're here, and clears once you leave.
  useEffect(() => () => markSeen(), [markSeen]);

  const status = (m: MilestoneState) =>
    m.done && m.earnedOn
      ? L.t('ms.reached', { date: L.shortDate(fromDayKey(m.earnedOn)) })
      : m.value > 0 && !m.done
        ? L.t('ms.progress', { value: grouped(L, m.value), target: grouped(L, m.target) })
        : L.t(`ms.${m.id}.d` as Key);

  return (
    <Screen gap={18}>
      <ScreenHeader title={L.t('ms.title')} subtitle={L.t('ms.subtitle')} />

      <Reveal index={0}>
        <Glass radius={26} padding={18}>
          <HadithBlock id="consistency" eyebrow />
        </Glass>
      </Reveal>

      <Reveal index={1}>
        <View style={{ gap: 12 }}>
          <SectionHeader title={L.t('ms.streaks')} />
          {[STREAKS.slice(0, 2), STREAKS.slice(2)].map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
              {row.map((s) => (
                <StreakTile key={s.kind} kind={s.kind} icon={s.icon} current={stats.streaks[s.kind].current} best={stats.streaks[s.kind].best} />
              ))}
            </View>
          ))}
          <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 4 }}>
            {L.t('ms.streakHint')}
          </Txt>
        </View>
      </Reveal>

      {MILESTONE_GROUPS.map((group, gi) => {
        const items = milestones.filter((m) => m.group === group);
        const done = items.filter((m) => m.done).length;
        return (
          <Reveal key={group} index={gi + 2}>
            <View style={{ gap: 10 }}>
              <SectionHeader title={L.t(`ms.group.${group}` as Key)} meta={`${L.num(done)}/${L.num(items.length)}`} />
              <Glass radius={24} padding={0} style={{ paddingHorizontal: 14 }}>
                {items.map((m, i) => (
                  <Press key={m.id} onPress={() => setOpen(m)} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={`${L.t(`ms.${m.id}` as Key)}. ${status(m)}`}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: t.line }}>
                      <Medallion m={m} celebrate={m.isNew} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Txt variant="bodyStrong" tone={m.done ? 'default' : 'soft'} style={{ flexShrink: 1 }}>
                            {L.t(`ms.${m.id}` as Key)}
                          </Txt>
                          {m.isNew && <Chip variant="ink" label={L.t('ms.new')} />}
                        </View>
                        <Txt variant="caption" tone="muted" tabular>
                          {status(m)}
                        </Txt>
                      </View>
                      {m.hadith ? <Icon name="quote" size={16} color={t.textMuted} /> : null}
                    </View>
                  </Press>
                ))}
              </Glass>
            </View>
          </Reveal>
        );
      })}

      <Txt variant="caption" tone="muted" style={{ textAlign: 'center', paddingHorizontal: 12 }}>
        {L.t('ms.private')}
      </Txt>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? L.t(`ms.${open.id}` as Key) : ''}>
        {open && (
          <View style={{ gap: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Medallion m={open} size={56} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="eyebrow" tone="muted">
                  {L.t('ms.howTo')}
                </Txt>
                <Txt variant="bodyStrong">{L.t(`ms.${open.id}.d` as Key)}</Txt>
                {(open.done || open.value > 0) && (
                  <Txt variant="caption" tone="muted" tabular>
                    {status(open)}
                  </Txt>
                )}
              </View>
            </View>
            {open.hadith && (
              <Glass radius={22} padding={16}>
                <HadithBlock id={open.hadith} eyebrow />
              </Glass>
            )}
          </View>
        )}
      </Sheet>
    </Screen>
  );
}
