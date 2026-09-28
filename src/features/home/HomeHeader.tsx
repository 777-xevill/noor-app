import { View } from 'react-native';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Txt } from '@/components/Txt';
import { toHijri } from '@/lib/hijri';
import { useT } from '@/i18n';
import { useSchedule } from '@/features/prayer/useSchedule';
import { useSettings } from '@/features/settings/store';
import { useTheme } from '@/theme/useTheme';

export function HomeHeader() {
  const t = useTheme();
  const L = useT();
  const name = useSettings((s) => s.displayName);
  const { schedule, hijriOffset } = useSchedule(60_000);
  const { day } = schedule;

  return (
    <View style={{ gap: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: t.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {name ? (
              <Txt variant="title" tone="onInk">
                {name.charAt(0).toUpperCase()}
              </Txt>
            ) : (
              <Icon name="user" size={20} color={t.onInk} />
            )}
          </View>
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
          <IconButton icon="bell" label={L.t('home.notifications')} badge />
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
