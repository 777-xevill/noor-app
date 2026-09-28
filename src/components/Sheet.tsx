import { type ReactNode, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spring, timing } from '@/theme/motion';
import { useTheme } from '@/theme/useTheme';
import { useT } from '@/i18n';
import { IconButton } from './IconButton';
import { Txt } from './Txt';

/** Bottom sheet: slides up with a spring, scrim fades, tap outside or ✕ to close. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const t = useTheme();
  const { t: tr } = useT();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(0);
  // Mount as soon as it opens; unmount only after the closing animation finishes.
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) progress.value = withSpring(1, spring.smooth);
    else
      progress.value = withTiming(0, timing.fade, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
  }, [open, progress]);

  const scrim = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * 520 }] }));

  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,12,15,0.38)' }, scrim]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={tr('common.close')} />
      </Animated.View>
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }} pointerEvents="box-none">
        <Animated.View
          style={[
            {
              width: '100%',
              maxWidth: 480,
              maxHeight: '86%',
              backgroundColor: t.surface,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              paddingTop: 10,
              paddingBottom: insets.bottom + 16,
              boxShadow: t.shadow,
            },
            panel,
          ]}
        >
          <View style={{ alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: t.lineStrong }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 6 }}>
            <Txt variant="h2">{title}</Txt>
            <IconButton icon="close" label={tr('common.close')} size={38} onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 6, gap: 14 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
