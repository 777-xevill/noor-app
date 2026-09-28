import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { background, clipShape, containerBackground, font, foregroundStyle, frame, monospacedDigit, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { PrayerWidgetProps } from '@/features/widget/snapshot';

// iOS home- and lock-screen widget. The function below is turned into a string at build time and
// runs inside the widget's own runtime: it may only use @expo/ui SwiftUI components and modifiers,
// with no imports, hooks or app state. Everything it shows arrives ready-made in `p`
// (see features/widget/snapshot.ts). The palette mirrors "Mist & Graphite" in theme/tokens.ts.
const PrayerTimes = (p: PrayerWidgetProps, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const c = dark
    ? { bg: '#24272C', text: '#F1F2F4', soft: '#C3C7CD', muted: '#969CA5', ink: '#F1F2F4', onInk: '#16181C' }
    : { bg: '#EEF1F4', text: '#16181C', soft: '#474C55', muted: '#697079', ink: '#16181C', onInk: '#FFFFFF' };
  const bg = containerBackground(c.bg, 'widget');

  if (!p || !p.rows) {
    return (
      <VStack alignment="leading" spacing={4} modifiers={[bg]}>
        <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(c.text)]}>Noor</Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(c.muted)]}>Open the app to set up prayer times.</Text>
      </VStack>
    );
  }

  const next = new Date(p.nextAt);

  if (env.widgetFamily === 'accessoryInline') {
    return <Text>{`${p.nextName} ${p.nextTime}`}</Text>;
  }

  if (env.widgetFamily === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1}>
        <Text modifiers={[font({ size: 12, weight: 'semibold' })]}>{p.nextLabel}</Text>
        <Text modifiers={[font({ size: 17, weight: 'bold' })]}>{`${p.nextName} ${p.nextTime}`}</Text>
        <Text date={next} dateStyle="timer" modifiers={[font({ size: 13 }), monospacedDigit()]} />
      </VStack>
    );
  }

  const hero = (
    <VStack alignment="leading" spacing={2}>
      <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(c.muted)]}>{p.nextLabel.toUpperCase()}</Text>
      <Text modifiers={[font({ size: 22, weight: 'semibold' }), foregroundStyle(c.text)]}>{p.nextName}</Text>
      <Text modifiers={[font({ size: 15, weight: 'medium' }), foregroundStyle(c.soft), monospacedDigit()]}>{p.nextTime}</Text>
      <Spacer />
      <Text date={next} dateStyle="timer" modifiers={[font({ size: 20, weight: 'semibold' }), foregroundStyle(c.text), monospacedDigit()]} />
      <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(c.muted)]}>{p.city}</Text>
    </VStack>
  );

  if (env.widgetFamily === 'systemSmall') {
    return <VStack alignment="leading" modifiers={[bg, frame({ minWidth: 0, minHeight: 0, alignment: 'topLeading' })]}>{hero}</VStack>;
  }

  return (
    <HStack spacing={14} modifiers={[bg]}>
      {hero}
      <VStack alignment="leading" spacing={2} modifiers={[frame({ width: 150 })]}>
        <Text modifiers={[font({ size: 10, weight: 'medium' }), foregroundStyle(c.muted), padding({ leading: 8, bottom: 2 })]}>{p.dateLine}</Text>
        {p.rows.map((r) => (
          <HStack
            key={r.name}
            modifiers={[padding({ leading: 8, trailing: 8, top: 3, bottom: 3 }), background(r.next ? c.ink : '#00000000'), clipShape('capsule')]}
          >
            <Text modifiers={[font({ size: 13, weight: r.next ? 'semibold' : 'regular' }), foregroundStyle(r.next ? c.onInk : c.text)]}>{r.name}</Text>
            <Spacer />
            <Text modifiers={[font({ size: 13, weight: r.next ? 'semibold' : 'regular' }), foregroundStyle(r.next ? c.onInk : c.soft), monospacedDigit()]}>{r.time}</Text>
          </HStack>
        ))}
      </VStack>
    </HStack>
  );
};

export const prayerTimesWidget = createWidget('PrayerTimes', PrayerTimes);
