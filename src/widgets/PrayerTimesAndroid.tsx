import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { PrayerWidgetProps } from '@/features/widget/snapshot';

// Android home-screen widget, drawn by react-native-android-widget from the same snapshot as iOS.
// Android can't be told in advance when to change, so the widget is redrawn when the app opens or
// its settings change, and by the system every 30 minutes (updatePeriodMillis in app.json).
// Fonts are registered in app.json; the palette mirrors "Mist & Graphite" in theme/tokens.ts.

type Palette = { bg: `#${string}`; text: `#${string}`; soft: `#${string}`; muted: `#${string}`; ink: `#${string}`; onInk: `#${string}` };
const LIGHT: Palette = { bg: '#EEF1F4', text: '#16181C', soft: '#474C55', muted: '#697079', ink: '#16181C', onInk: '#FFFFFF' };
const DARK: Palette = { bg: '#24272C', text: '#F1F2F4', soft: '#C3C7CD', muted: '#969CA5', ink: '#F1F2F4', onInk: '#16181C' };

function Layout({ p, c, wide }: { p: PrayerWidgetProps | null; c: Palette; wide: boolean }) {
  const bn = p?.lang === 'bn';
  const f = {
    regular: bn ? 'HindSiliguri_400Regular' : 'Geist_400Regular',
    medium: bn ? 'HindSiliguri_500Medium' : 'Geist_500Medium',
    semibold: bn ? 'HindSiliguri_600SemiBold' : 'Geist_600SemiBold',
  };

  if (!p) {
    return (
      <FlexWidget clickAction="OPEN_APP" style={{ height: 'match_parent', width: 'match_parent', backgroundColor: c.bg, borderRadius: 24, padding: 16, justifyContent: 'center' }}>
        <TextWidget text="Noor" style={{ fontSize: 15, fontFamily: f.semibold, color: c.text }} />
        <TextWidget text="Open the app to set up prayer times." style={{ fontSize: 12, fontFamily: f.regular, color: c.muted }} />
      </FlexWidget>
    );
  }

  const hero = (
    <FlexWidget style={{ flex: 1, height: 'match_parent', flexDirection: 'column', justifyContent: 'space-between' }}>
      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget text={p.nextLabel.toUpperCase()} style={{ fontSize: 10, fontFamily: f.semibold, color: c.muted, letterSpacing: 0.1 }} />
        <TextWidget text={p.nextName} style={{ fontSize: 22, fontFamily: f.semibold, color: c.text }} />
        <TextWidget text={p.nextTime} style={{ fontSize: 15, fontFamily: f.medium, color: c.soft }} />
      </FlexWidget>
      <TextWidget text={p.city} style={{ fontSize: 11, fontFamily: f.medium, color: c.muted }} />
    </FlexWidget>
  );

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{ height: 'match_parent', width: 'match_parent', backgroundColor: c.bg, borderRadius: 24, padding: 16, flexDirection: 'row', flexGap: 14 }}
    >
      {hero}
      {wide && (
        <FlexWidget style={{ width: 150, height: 'match_parent', flexDirection: 'column', justifyContent: 'center' }}>
          <TextWidget text={p.dateLine} maxLines={1} style={{ fontSize: 10, fontFamily: f.medium, color: c.muted, marginLeft: 8, marginBottom: 2 }} />
          {p.rows.map((r) => (
            <FlexWidget
              key={r.name}
              style={{
                width: 'match_parent',
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
                backgroundColor: r.next ? c.ink : '#00000000',
              }}
            >
              <TextWidget text={r.name} style={{ fontSize: 13, fontFamily: r.next ? f.semibold : f.regular, color: r.next ? c.onInk : c.text }} />
              <TextWidget text={r.time} style={{ fontSize: 13, fontFamily: r.next ? f.semibold : f.regular, color: r.next ? c.onInk : c.soft }} />
            </FlexWidget>
          ))}
        </FlexWidget>
      )}
    </FlexWidget>
  );
}

/** Both colour schemes; Android shows the one matching the system theme. */
export function renderPrayerWidget(p: PrayerWidgetProps | null, width: number) {
  const wide = width >= 250;
  return { light: <Layout p={p} c={LIGHT} wide={wide} />, dark: <Layout p={p} c={DARK} wide={wide} /> };
}
