import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { type Bar, BarChart } from '@/components/BarChart';
import { Field } from '@/components/Field';
import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { addDays, dayKey } from '@/lib/dates';
import { useT } from '@/i18n';
import { usePrayerLog } from '@/features/prayer/log';
import { pickAvatar, removeAvatar } from '@/features/profile/avatar';
import { useQuranProgress } from '@/features/quran/progress';
import { useMilestones } from '@/features/rewards/useMilestones';
import { useSettings } from '@/features/settings/store';
import { useSyncMeta } from '@/features/sync/store';
import { useTasbih } from '@/features/tasbih/store';
import { useTheme } from '@/theme/useTheme';

function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  const t = useTheme();
  return (
    <Glass radius={22} padding={14} style={{ flex: 1, gap: 8 }}>
      <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: t.pill, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16} color={t.text} />
      </View>
      <View>
        <Txt variant="h2" tabular>
          {value}
        </Txt>
        <Txt variant="caption" tone="muted" numberOfLines={2}>
          {label}
        </Txt>
      </View>
    </Glass>
  );
}

function ChartCard({ title, caption, bars, max }: { title: string; caption: string; bars: Bar[]; max: number }) {
  return (
    <Glass radius={26} padding={16} style={{ gap: 14 }}>
      <View>
        <Txt variant="title">{title}</Txt>
        <Txt variant="caption" tone="muted">
          {caption}
        </Txt>
      </View>
      <BarChart bars={bars} max={max} />
    </Glass>
  );
}

/** Opened from the photo on Home: who you are, your photo, and how your worship is going. */
export default function ProfileScreen() {
  const t = useTheme();
  const L = useT();
  const name = useSettings((s) => s.displayName);
  const setName = useSettings((s) => s.setDisplayName);
  const avatarUri = useSettings((s) => s.avatarUri);
  const email = useSyncMeta((m) => m.email);
  const prayers = usePrayerLog((s) => s.days);
  const reading = useQuranProgress((s) => s.readingSeconds);
  const goal = useQuranProgress((s) => s.goalMinutes);
  const dhikr = useTasbih((s) => s.daily);
  const { stats, milestones } = useMilestones();
  const [photoError, setPhotoError] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
  }, []);

  const charts = useMemo(() => {
    const days = (n: number) => Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
    const label = (p: { y: number; m: number; d: number }, i: number, n: number) => (n > 7 ? (i % 2 === n % 2 ? '' : L.num(p.d)) : L.weekdayShort(p));
    const two = days(14);
    const week = days(7);
    const prayerBars = two.map((p, i) => ({ label: label(p, i, 14), value: prayers[dayKey(p)]?.length ?? 0, highlight: i === 13 }));
    const readBars = week.map((p, i) => ({ label: label(p, i, 7), value: Math.round((reading[dayKey(p)] ?? 0) / 60), highlight: i === 6 }));
    const dhikrBars = week.map((p, i) => ({ label: label(p, i, 7), value: dhikr[dayKey(p)] ?? 0, highlight: i === 6 }));
    return {
      prayerBars,
      prayerTotal: prayerBars.reduce((a, b) => a + b.value, 0),
      readBars,
      readTotal: readBars.reduce((a, b) => a + b.value, 0),
      dhikrBars,
      dhikrTotal: dhikrBars.reduce((a, b) => a + b.value, 0),
    };
  }, [today, prayers, reading, dhikr, L]);

  const earned = milestones.filter((m) => m.done).length;

  const choosePhoto = async () => {
    setPhotoError(false);
    try {
      await pickAvatar();
    } catch {
      setPhotoError(true);
    }
  };

  return (
    <Screen gap={18}>
      <ScreenHeader title={L.t('profile.title')} />

      <Reveal index={0}>
        <Glass strong radius={30} padding={20} style={{ alignItems: 'center', gap: 14 }}>
          <Press onPress={choosePhoto} scaleTo={0.95} accessibilityRole="button" accessibilityLabel={L.t('profile.changePhoto')}>
            <Avatar size={104} />
            <View
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.lineStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="camera" size={17} color={t.text} />
            </View>
          </Press>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Press onPress={choosePhoto} accessibilityRole="button" style={{ padding: 4 }}>
              <Txt variant="caption">{L.t(avatarUri ? 'profile.changePhoto' : 'profile.addPhoto')}</Txt>
            </Press>
            {avatarUri ? (
              <Press onPress={removeAvatar} accessibilityRole="button" style={{ padding: 4 }}>
                <Txt variant="caption" tone="muted">
                  {L.t('profile.removePhoto')}
                </Txt>
              </Press>
            ) : null}
          </View>
          {photoError && (
            <Txt variant="caption" tone="soft">
              {L.t('profile.photoError')}
            </Txt>
          )}
          <View style={{ alignSelf: 'stretch' }}>
            <Field icon="user" placeholder={L.t('settings.namePh')} value={name} onChangeText={setName} autoCapitalize="words" maxLength={40} />
          </View>
          <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            {L.t('profile.private')}
          </Txt>
        </Glass>
      </Reveal>

      <Reveal index={1}>
        <View style={{ gap: 10 }}>
          <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
            {L.t('profile.progress')}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Stat icon="flame" value={L.num(stats.streaks.prayer.current)} label={L.t('profile.streak')} />
            <Stat icon="award" value={L.num(stats.streaks.prayer.best)} label={L.t('profile.best')} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Stat icon="mosque" value={L.num(stats.prayersLogged)} label={L.t('profile.prayers')} />
            <Stat icon="book" value={L.num(stats.readingMinutes)} label={L.t('profile.minutes')} />
          </View>
        </View>
      </Reveal>

      <Reveal index={2}>
        <ChartCard
          title={L.t('profile.chartPrayers')}
          caption={L.t('profile.chartPrayersSub', { n: charts.prayerTotal, max: 70 })}
          bars={charts.prayerBars}
          max={5}
        />
      </Reveal>

      <Reveal index={3}>
        <ChartCard
          title={L.t('profile.chartQuran')}
          caption={L.t('profile.chartQuranSub', { n: charts.readTotal, goal })}
          bars={charts.readBars}
          max={Math.max(goal, ...charts.readBars.map((b) => b.value))}
        />
      </Reveal>

      <Reveal index={4}>
        <ChartCard
          title={L.t('profile.chartDhikr')}
          caption={L.t('profile.chartDhikrSub', { n: charts.dhikrTotal })}
          bars={charts.dhikrBars}
          max={Math.max(33, ...charts.dhikrBars.map((b) => b.value))}
        />
      </Reveal>

      <Reveal index={5}>
        <ListGroup>
          <ListRow icon="award" title={L.t('ms.title')} value={L.t('profile.earned', { n: earned, total: milestones.length })} onPress={() => router.push('/milestones')} />
          <ListRow icon="calendarRange" title={L.t('prayers.tracker')} onPress={() => router.push('/tracker')} />
          <ListRow icon="cloud" title={L.t('settings.account')} value={email ?? L.t('settings.accountOff')} onPress={() => router.push('/settings/account')} />
          <ListRow icon="settings" title={L.t('settings.title')} onPress={() => router.push('/settings')} last />
        </ListGroup>
      </Reveal>
    </Screen>
  );
}
