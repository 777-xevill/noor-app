import { useEffect, useRef } from 'react';
import { ImageBackground, Platform, Share, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Press } from '@/components/Press';
import { Txt } from '@/components/Txt';
import { DAILY_VERSES } from '@/data/dailyVerses';
import type { DayParts } from '@/lib/dates';
import { useSchedule } from '@/features/prayer/useSchedule';
import { useQuranProgress } from '@/features/quran/progress';
import { spring } from '@/theme/motion';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';

const PHOTO = require('../../../assets/images/dome-ubudiah.jpg');

const dayNumber = (p: DayParts) => Math.floor(Date.UTC(p.y, p.m, p.d) / 86_400_000);

/** Bookmark that fills in and gives a small lift when saved. */
function BookmarkButton({ verseKey }: { verseKey: string }) {
  const t = useTheme();
  const L = useT();
  const saved = useQuranProgress((s) => s.bookmarks.includes(verseKey));
  const toggle = useQuranProgress((s) => s.toggleBookmark);
  const lift = useSharedValue(1);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current && saved) {
      lift.value = withSequence(withTiming(1.25, { duration: 120 }), withSpring(1, spring.bouncy));
    }
    mounted.current = true;
  }, [saved, lift]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: lift.value }] }));

  return (
    <Press
      hitSlop={12}
      scaleTo={0.82}
      accessibilityRole="button"
      accessibilityState={{ selected: saved }}
      accessibilityLabel={L.t(saved ? 'home.removeBookmark' : 'home.bookmarkVerse')}
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggle(verseKey);
      }}
    >
      <Animated.View style={style}>
        <Icon name="bookmark" size={19} color={t.text} fill={saved ? t.text : 'none'} />
      </Animated.View>
    </Press>
  );
}

export function VerseCard() {
  const t = useTheme();
  const L = useT();
  const { schedule } = useSchedule(60_000);
  const verse = DAILY_VERSES[dayNumber(schedule.day) % DAILY_VERSES.length];
  // The reader's language first, the other translation beneath it.
  const [first, second] = L.lang === 'bn' ? [verse.bn, verse.en] : [verse.en, verse.bn];

  return (
    <View style={[styles.card, { boxShadow: t.shadow }]}>
      <ImageBackground source={PHOTO} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(14,16,19,0.38)', 'rgba(14,16,19,0)']} style={styles.topScrim} />

      <View style={styles.top}>
        <Chip variant="photo" label={L.t('home.verseOfDay')} />
        <IconButton
          icon="share"
          label={L.t('home.shareVerse')}
          variant="photo"
          size={38}
          onPress={() =>
            // Share can be unavailable (e.g. some browsers); failing silently is fine here.
            Share.share({ message: `${verse.arabic}\n\n${first}\n\n— ${verse.surah} ${verse.key}` }).catch(() => {})
          }
        />
      </View>

      <Glass strong radius={24} padding={18} style={{ gap: 12 }}>
        <Txt variant="arabic">{verse.arabic}</Txt>
        <View style={{ gap: 6 }}>
          <Txt variant="body" tone="soft" style={L.lang === 'bn' ? { fontSize: 16, lineHeight: 26 } : undefined}>
            {first}
          </Txt>
          <Txt variant="body" tone="muted" style={{ fontSize: 14 }}>
            {second}
          </Txt>
        </View>
        <View style={{ height: 1, backgroundColor: t.line }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt variant="caption" tone="soft">
            {verse.surah} · {L.num(verse.key)}
          </Txt>
          <BookmarkButton verseKey={verse.key} />
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 30, overflow: 'hidden', padding: 10, paddingTop: 170, minHeight: 440, justifyContent: 'flex-end' },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 140 },
  top: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
