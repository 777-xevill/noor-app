import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Chip } from '@/components/Chip';
import { IconButton } from '@/components/IconButton';
import { useScreenScroll } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { addDays } from '@/lib/dates';
import { useT } from '@/i18n';
import { useSchedule } from '@/features/prayer/useSchedule';
import { fonts } from '@/theme/fonts';
import { onPhoto } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const PHOTO = require('../../../assets/images/hero-medina.jpg');
// The photo is taller than the card so it can drift without exposing an edge.
const BLEED = 56;

export function NextPrayerHero() {
  const t = useTheme();
  const { now, loc, prefs, schedule } = useSchedule();
  const { key, at, tomorrow } = schedule.next;
  const L = useT();
  const clock = L.clock(at, loc.timeZone);
  const sunrise = L.clock(schedule.times.sunrise, loc.timeZone);
  const scrollY = useScreenScroll();

  // Parallax: the photo travels slower than the card while scrolling, and swells on pull-down.
  const photoStyle = useAnimatedStyle(() => {
    const y = scrollY?.value ?? 0;
    return {
      transform: [
        { translateY: interpolate(y, [-200, 0, 380], [-BLEED, 0, BLEED], Extrapolation.CLAMP) },
        { scale: interpolate(y, [-200, 0], [1.18, 1], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <View style={[styles.card, { boxShadow: t.shadow }]}>
      <Animated.Image source={PHOTO} resizeMode="cover" style={[styles.photo, photoStyle]} />
      <LinearGradient colors={onPhoto.scrim} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />

      <View style={styles.inner}>
        <View style={styles.row}>
          <Chip variant="photo" live label={L.t(tomorrow ? 'home.nextTomorrow' : 'home.nextPrayer')} />
          <Chip variant="photo" icon="mapPin" label={loc.city} />
        </View>

        <View style={{ gap: 14 }}>
          <View>
            <Txt style={styles.name} color={onPhoto.text}>
              {L.prayer(key, schedule.next.tomorrow ? addDays(schedule.day, 1) : schedule.day)}
            </Txt>
            <View style={styles.timeRow}>
              <Txt variant="display" color={onPhoto.text} tabular>
                {clock.hm}
              </Txt>
              <Txt variant="h2" color={onPhoto.textSoft} style={{ marginBottom: 11 }}>
                {clock.period}
              </Txt>
            </View>
          </View>

          <View style={[styles.row, { alignItems: 'center' }]}>
            <View style={{ flexDirection: 'row', gap: 8, flexShrink: 1, flexWrap: 'wrap' }}>
              <Chip variant="photo" label={L.t('time.in', { t: L.countdown(at.getTime() - now.getTime()) })} />
              <Chip variant="photo" icon="sunrise" label={L.t('home.sunriseAt', { t: sunrise.hm })} />
            </View>
            <IconButton icon="bell" label={L.t('home.adhanOn')} variant="photo" size={42} />
          </View>

          <Txt variant="micro" color={onPhoto.textSoft}>
            {L.t('home.methodLine', { method: L.t(`method.${prefs.method}`), madhab: L.t(`madhab.${prefs.madhab}`) })}
          </Txt>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { height: 372, borderRadius: 30, overflow: 'hidden' },
  photo: { position: 'absolute', left: 0, right: 0, top: -BLEED, bottom: -BLEED, width: '100%', height: 372 + BLEED * 2 },
  inner: { flex: 1, padding: 18, justifyContent: 'space-between' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  name: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 38, letterSpacing: -1.2 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
});
