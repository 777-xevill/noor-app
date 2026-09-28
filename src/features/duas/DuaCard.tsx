import { useState } from 'react';
import { Platform, Share, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { ProgressRing } from '@/components/ProgressRing';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';
import { type Dua, isInstruction, useSavedDuas } from './data';

/** One dua: Arabic, transliteration, meaning, and a counter when it's said more than once. */
export function DuaCard({ chapterId, chapterTitle, dua }: { chapterId: number; chapterTitle: string; dua: Dua }) {
  const t = useTheme();
  const L = useT();
  const key = `${chapterId}:${dua.id}`;
  const saved = useSavedDuas((s) => s.saved.includes(key));
  const toggle = useSavedDuas((s) => s.toggle);
  const [count, setCount] = useState(0);
  const done = dua.repeat > 1 && count >= dua.repeat;

  const tap = () => {
    if (done) {
      setCount(0);
      return;
    }
    const next = count + 1;
    setCount(next);
    if (Platform.OS !== 'web') {
      if (next >= dua.repeat) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Glass radius={26} padding={18} style={{ gap: 14 }}>
      <Txt variant="arabic" style={{ fontSize: 25, lineHeight: 50 }}>
        {dua.ar}
      </Txt>
      {dua.tr ? (
        isInstruction(dua.tr) ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="info" size={15} color={t.textMuted} />
            <Txt variant="caption" tone="muted" style={{ flex: 1 }}>
              {dua.tr}
            </Txt>
          </View>
        ) : (
          <Txt variant="body" tone="muted" style={{ fontStyle: 'italic' }}>
            {dua.tr}
          </Txt>
        )
      ) : null}
      {dua.en ? (
        <Txt variant="body" tone="soft">
          {dua.en}
        </Txt>
      ) : null}

      <View style={{ height: 1, backgroundColor: t.line }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {dua.repeat > 1 ? (
          <Press
            onPress={tap}
            scaleTo={0.92}
            accessibilityRole="button"
            accessibilityLabel={done ? L.t('duas.doneA11y') : L.t('duas.countA11y', { c: count + 1, n: dua.repeat })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <ProgressRing size={30} stroke={3} progress={count / dua.repeat} color={t.ink} track={t.track} />
            <Txt variant="caption" tone={done ? 'default' : 'soft'} tabular>
              {done ? L.t('duas.completed') : L.t('duas.tapCount', { c: count, n: dua.repeat })}
            </Txt>
          </Press>
        ) : (
          <Txt variant="caption" tone="muted">
            {L.t('duas.sayOnce')}
          </Txt>
        )}
        <View style={{ flex: 1 }} />
        <Press
          hitSlop={10}
          scaleTo={0.82}
          accessibilityRole="button"
          accessibilityLabel={L.t(saved ? 'duas.unsave' : 'duas.save')}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggle(key);
          }}
        >
          <Icon name="bookmark" size={19} color={t.text} fill={saved ? t.text : 'none'} />
        </Press>
        <Press
          hitSlop={10}
          scaleTo={0.82}
          accessibilityRole="button"
          accessibilityLabel={L.t('duas.share')}
          onPress={() =>
            Share.share({ message: `${dua.ar}\n\n${dua.en}\n\n— Hisnul Muslim: ${chapterTitle}` }).catch(() => {})
          }
        >
          <Icon name="share" size={19} color={t.text} />
        </Press>
      </View>
    </Glass>
  );
}
