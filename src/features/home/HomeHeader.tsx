import { View } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Press } from '@/components/Press';
import { Chip } from '@/components/Chip';
import { IconButton } from '@/components/IconButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Txt } from '@/components/Txt';
import { toHijri } from '@/lib/hijri';
import { useT } from '@/i18n';
import { useSchedule } from '@/features/prayer/useSchedule';
import { useRewards } from '@/features/rewards/store';
import { useSettings } from '@/features/settings/store';

export function HomeHeader() {
  const L = useT();
  const name = useSettings((s) => s.displayName);
  const { schedule, hijriOffset } = useSchedule(60_000);
  const { day } = schedule;
  // The dot shows until the notifications page has been opened today, or while a milestone is unseen.
  const seenAt = useSettings((s) => s.notificationsSeenAt);
  const unseen = useRewards((s) => s.unseen.length);
  const startOfToday = new Date(day.y, day.m, day.d).getTime();
  const hasNews = unseen > 0 || seenAt < startOfToday;

  return (
    <View style={{ gap: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 }}>
          <Press onPress={() => router.push('/profile')} scaleTo={0.92} accessibilityRole="button" accessibilityLabel={L.t('profile.title')}>
            <Avatar size={46} />
          </Press>
          <View style={{ flexShrink: 1 }}>
            <Txt variant="caption" tone="muted">
              {L.t('home.salam')}
            </Txt>
            <Txt variant="h2" numberOfLines={1}>
              {name || L.t('home.welcome')}
            </Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ThemeToggle />
          <IconButton icon="bell" label={L.t('home.notifications')} badge={hasNews} onPress={() => router.push('/notifications')} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="h1">
          {L.weekday(day)},{' '}
          <Txt variant="h1" tone="muted">
            {L.dayMonth(day)}
          </Txt>
        </Txt>
        <Chip icon="moonStar" label={`${L.hijri(toHijri(day, hijriOffset))} ${L.t('common.ah')}`} />
      </View>
    </View>
  );
}
