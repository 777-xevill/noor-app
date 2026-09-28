import { Share, View } from 'react-native';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { GREETINGS } from '@/data/phrases';
import { useTheme } from '@/theme/useTheme';

export default function GreetingsScreen() {
  const t = useTheme();
  return (
    <Screen gap={12}>
      <ScreenHeader title="Greetings & phrases" subtitle="What to say, and when" />
      {GREETINGS.map((g, i) => (
        <Reveal key={g.tr} index={Math.min(i, 6)}>
          <Glass radius={24} padding={16} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Txt variant="title">{g.tr}</Txt>
                <Txt variant="caption" tone="muted">
                  {g.en}
                </Txt>
              </View>
              <Txt variant="arabic" style={{ fontSize: 24, lineHeight: 44, flexShrink: 1 }}>
                {g.ar}
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Txt variant="caption" tone="soft" style={{ flex: 1 }}>
                {g.when}
              </Txt>
              <Press
                hitSlop={10}
                scaleTo={0.82}
                accessibilityRole="button"
                accessibilityLabel={`Share ${g.tr}`}
                onPress={() => Share.share({ message: `${g.ar}\n${g.tr}: ${g.en}` }).catch(() => {})}
              >
                <Icon name="share" size={17} color={t.textSoft} />
              </Press>
            </View>
          </Glass>
        </Reveal>
      ))}
    </Screen>
  );
}
