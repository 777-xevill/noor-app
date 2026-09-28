import { Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { IconButton } from '@/components/IconButton';
import { Press } from '@/components/Press';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { dayKey, wallDay } from '@/lib/dates';
import { useSettings } from '@/features/settings/store';
import { AFTER_PRAYER, PHRASES } from '@/features/tasbih/phrases';
import { type TasbihMode, useTasbih } from '@/features/tasbih/store';
import { fonts } from '@/theme/fonts';
import { spring } from '@/theme/motion';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';

const TARGETS = [33, 99, 100, 0];

export default function TasbihScreen() {
  const t = useTheme();
  const L = useT();
  const bn = L.lang === 'bn';
  const { width } = useWindowDimensions();
  const tz = useSettings((s) => s.location.timeZone);
  const s = useTasbih();
  const today = dayKey(wallDay(new Date(), tz));
  const todayTotal = s.daily[today] ?? 0;

  const inSequence = s.mode === 'afterPrayer';
  const stepInfo = AFTER_PRAYER[Math.min(s.step, AFTER_PRAYER.length - 1)];
  const phrase = PHRASES.find((p) => p.id === (inSequence ? stepInfo.phraseId : s.phraseId)) ?? PHRASES[0];
  const target = inSequence ? stepInfo.count : s.target;
  const sequenceDone = inSequence && s.step >= AFTER_PRAYER.length;

  const bump = useSharedValue(1);
  const numberStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  const size = Math.min(width - 72, 290);

  const tap = () => {
    if (sequenceDone) return;
    const next = s.count + 1;
    s.addDaily(today);
    bump.set(withSequence(withTiming(1.08, { duration: 70 }), withSpring(1, spring.release)));
    if (target > 0 && next >= target) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (inSequence) s.set({ count: 0, step: s.step + 1 });
      else s.set({ count: 0, rounds: s.rounds + 1 });
    } else {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      s.set({ count: next });
    }
  };

  const reset = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    s.set({ count: 0, rounds: 0, step: 0 });
  };

  return (
    <Screen gap={18}>
      <ScreenHeader title={L.t('tasbih.title')} subtitle={L.t('tasbih.today', { n: L.num(todayTotal.toLocaleString('en-US')) })} right={<IconButton icon="reset" label={L.t('tasbih.reset')} onPress={reset} />} />

      <Segmented<TasbihMode>
        value={s.mode}
        onChange={(mode) => s.set({ mode, count: 0, step: 0, rounds: 0 })}
        options={[
          { value: 'free', label: L.t('tasbih.dhikr') },
          { value: 'afterPrayer', label: L.t('tasbih.afterPrayer') },
        ]}
      />

      {!inSequence && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
          {PHRASES.map((p) => (
            <Press key={p.id} scaleTo={0.94} onPress={() => s.set({ phraseId: p.id, count: 0, rounds: 0 })} accessibilityRole="button" accessibilityLabel={bn ? p.trBn : p.tr}>
              <Chip variant={p.id === s.phraseId ? 'ink' : 'glass'} label={bn ? p.trBn : p.tr} />
            </Press>
          ))}
        </ScrollView>
      )}

      <Glass strong radius={28} padding={18} style={{ alignItems: 'center', gap: 6 }}>
        <Txt variant="arabic" style={{ textAlign: 'center', fontSize: 30, lineHeight: 56 }}>
          {phrase.ar}
        </Txt>
        <Txt variant="title">{bn ? phrase.trBn : phrase.tr}</Txt>
        <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          {bn ? phrase.bn : phrase.en}
        </Txt>
      </Glass>

      {/* The whole ring is the button: tap anywhere inside it to count. */}
      <Pressable onPress={tap} accessibilityRole="button" accessibilityLabel={L.t('tasbih.countA11y', { n: s.count })} style={{ alignSelf: 'center' }}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute' }}>
            <ProgressRing size={size} stroke={10} progress={sequenceDone ? 1 : target ? s.count / target : 0} color={t.ink} track={t.track} />
          </View>
          <View
            style={{
              width: size - 44,
              height: size - 44,
              borderRadius: size,
              backgroundColor: t.glassStrong,
              borderWidth: 1,
              borderColor: t.glassBorder,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: t.shadow,
            }}
          >
            {sequenceDone ? (
              <>
                <Txt variant="h1">{L.t('tasbih.complete')}</Txt>
                <Txt variant="caption" tone="muted">
                  {L.t('tasbih.accept')}
                </Txt>
              </>
            ) : (
              <>
                <Animated.View style={numberStyle}>
                  <Txt style={{ fontFamily: fonts.semibold, fontSize: 76, lineHeight: 84, letterSpacing: -3, color: t.text }} tabular>
                    {L.num(s.count)}
                  </Txt>
                </Animated.View>
                <Txt variant="caption" tone="muted" tabular>
                  {target ? L.t('tasbih.of', { n: target }) : L.t('tasbih.noLimit')}
                  {!inSequence && s.rounds > 0 ? L.t('tasbih.round', { n: s.rounds + 1 }) : ''}
                  {inSequence ? L.t('tasbih.step', { n: s.step + 1 }) : ''}
                </Txt>
              </>
            )}
          </View>
        </View>
      </Pressable>
      <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
        {L.t('tasbih.tap')}
      </Txt>

      {!inSequence && (
        <View style={{ gap: 8 }}>
          <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
            {L.t('tasbih.target')}
          </Txt>
          <Segmented
            value={String(s.target)}
            onChange={(v) => s.set({ target: Number(v), count: 0, rounds: 0 })}
            options={TARGETS.map((n) => ({ value: String(n), label: n ? L.num(n) : '∞' }))}
          />
        </View>
      )}
      {sequenceDone && (
        <Press onPress={reset} style={{ alignSelf: 'center' }} accessibilityRole="button">
          <Chip variant="ink" label={L.t('tasbih.again')} />
        </Press>
      )}
    </Screen>
  );
}
