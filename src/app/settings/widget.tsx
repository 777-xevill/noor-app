import { Platform, View } from 'react-native';
import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { useNow } from '@/lib/useNow';
import { useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { selectPrayerPrefs, useSettings } from '@/features/settings/store';
import { type PrayerWidgetProps, widgetSnapshot } from '@/features/widget/snapshot';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

// A faithful stand-in for the native widgets (widgets/PrayerTimesWidget.tsx for iOS,
// widgets/PrayerTimesAndroid.tsx for Android), drawn from the same snapshot, so the design can be
// seen anywhere — including the web preview.

const WIDGET_BG = { light: '#EEF1F4', dark: '#24272C' };
const SIZE = 158;

function timer(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function Hero({ p, now }: { p: PrayerWidgetProps; now: Date }) {
  const L = useT();
  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <View style={{ gap: 1 }}>
        <Txt variant="micro" tone="muted" style={{ fontFamily: fonts.semibold, letterSpacing: L.lang === 'en' ? 0.6 : 0 }}>
          {L.lang === 'en' ? p.nextLabel.toUpperCase() : p.nextLabel}
        </Txt>
        <Txt style={{ fontFamily: fonts.semibold, fontSize: 22, lineHeight: 27 }}>{p.nextName}</Txt>
        <Txt variant="bodyStrong" tone="soft" tabular>
          {p.nextTime}
        </Txt>
      </View>
      <View style={{ gap: 1 }}>
        <Txt tabular style={{ fontFamily: fonts.semibold, fontSize: 20, lineHeight: 25 }}>
          {L.num(timer(p.nextAt - now.getTime()))}
        </Txt>
        <Txt variant="micro" tone="muted">
          {p.city}
        </Txt>
      </View>
    </View>
  );
}

function Frame({ children, width }: { children: React.ReactNode; width?: number }) {
  const t = useTheme();
  return (
    <View
      style={{
        width,
        flex: width ? undefined : 1,
        height: SIZE,
        borderRadius: 24,
        padding: 15,
        backgroundColor: WIDGET_BG[t.scheme],
        boxShadow: t.shadow,
        flexDirection: 'row',
        gap: 14,
      }}
    >
      {children}
    </View>
  );
}

function HowTo({ icon, title, body }: { icon: IconName; title: Key; body: Key }) {
  const t = useTheme();
  const L = useT();
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: t.pill, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={t.text} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong">{L.t(title)}</Txt>
        <Txt variant="caption" tone="soft">
          {L.t(body)}
        </Txt>
      </View>
    </View>
  );
}

export default function WidgetScreen() {
  const t = useTheme();
  const L = useT();
  const now = useNow(1000);
  const s = useSettings();
  const p = widgetSnapshot(now, { loc: s.location, prefs: selectPrayerPrefs(s), hijriOffset: s.hijriOffset, lang: s.language });

  return (
    <Screen gap={18}>
      <ScreenHeader title={L.t('widget.title')} subtitle={L.t('widget.subtitle')} />

      {Platform.OS === 'web' && (
        <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 4 }}>
          {L.t('widget.webNote')}
        </Txt>
      )}

      <Reveal index={0}>
        <View style={{ gap: 8 }}>
          <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
            {L.t('widget.small')}
          </Txt>
          <Frame width={SIZE}>
            <Hero p={p} now={now} />
          </Frame>
        </View>
      </Reveal>

      <Reveal index={1}>
        <View style={{ gap: 8 }}>
          <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
            {L.t('widget.medium')}
          </Txt>
          <Frame>
            <Hero p={p} now={now} />
            <View style={{ width: 158, justifyContent: 'center', gap: 1 }}>
              <Txt variant="micro" tone="muted" numberOfLines={1} style={{ paddingHorizontal: 8, marginBottom: 2 }}>
                {p.dateLine}
              </Txt>
              {p.rows.map((r) => (
                <View
                  key={r.name}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: r.next ? t.ink : 'transparent' }}
                >
                  <Txt variant="caption" color={r.next ? t.onInk : t.text} style={{ fontFamily: r.next ? fonts.semibold : fonts.regular, fontSize: 13 }}>
                    {r.name}
                  </Txt>
                  <Txt variant="caption" tabular color={r.next ? t.onInk : t.textSoft} style={{ fontFamily: r.next ? fonts.semibold : fonts.regular, fontSize: 13 }}>
                    {r.time}
                  </Txt>
                </View>
              ))}
            </View>
          </Frame>
        </View>
      </Reveal>

      <Reveal index={2}>
        <Glass radius={24} padding={16} style={{ gap: 16 }}>
          <Txt variant="title">{L.t('widget.howTo')}</Txt>
          <HowTo icon="grid" title="widget.iphone" body="widget.iphoneHow" />
          <HowTo icon="home" title="widget.android" body="widget.androidHow" />
          <Txt variant="caption" tone="muted">
            {L.t('widget.note')}
          </Txt>
        </Glass>
      </Reveal>
    </Screen>
  );
}
