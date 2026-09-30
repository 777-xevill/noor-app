import { View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Txt } from './Txt';

export type Bar = { label: string; value: number; highlight?: boolean };

/**
 * Simple column chart drawn with plain views: one ink column per value, to scale against `max`,
 * with its label underneath. The highlighted column (usually today) is full ink, the rest softer.
 */
export function BarChart({ bars, max, height = 96 }: { bars: Bar[]; max: number; height?: number }) {
  const t = useTheme();
  const top = Math.max(max, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
      {bars.map((b, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
          <View style={{ height, width: '100%', maxWidth: 22, justifyContent: 'flex-end', borderRadius: 7, backgroundColor: t.track, overflow: 'hidden' }}>
            <View style={{ height: `${Math.min(1, b.value / top) * 100}%`, borderRadius: 7, backgroundColor: t.ink, opacity: b.highlight ? 1 : 0.72 }} />
          </View>
          <View style={{ height: 16, justifyContent: 'center' }}>
            <Txt variant="micro" tone={b.highlight ? 'default' : 'muted'} numberOfLines={1}>
              {b.label}
            </Txt>
          </View>
        </View>
      ))}
    </View>
  );
}
