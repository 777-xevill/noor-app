import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Field } from '@/components/Field';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { LANGS, type Lang, useT } from '@/i18n';
import type { Key } from '@/i18n/en';
import { ADHAN_CREDIT } from '@/features/prayer/adhan';
import { useQuranProgress } from '@/features/quran/progress';
import { PRIVACY_URL, TERMS_URL } from '@/lib/site';
import { usePlus } from '@/features/premium/store';
import { useSyncMeta } from '@/features/sync/store';
import { type DarkStyle, type ThemeMode, useSettings } from '@/features/settings/store';

// [label key, source]. Sources are proper names and stay as published.
const SOURCES: [Key, string][] = [
  ['src.quranAr', 'Tanzil.net Uthmani text, via api.alquran.cloud'],
  ['src.quranEn', 'Saheeh International'],
  ['src.quranBn', 'Muhiuddin Khan'],
  ['src.recitation', 'Mishary Rashid Alafasy, everyayah.com'],
  ['src.duas', 'Hisnul Muslim (Fortress of the Muslim), Sa’id ibn Ali ibn Wahf al-Qahtani, via hisnmuslim.com'],
  ['src.names', 'api.aladhan.com'],
  ['src.times', 'adhan (Batoul Apps), checked against api.aladhan.com'],
  ['src.cities', '© OpenStreetMap contributors'],
  ['src.adhan', ADHAN_CREDIT],
];

export default function SettingsScreen() {
  const s = useSettings();
  const L = useT();
  const goal = useQuranProgress((q) => q.goalMinutes);
  const accountEmail = useSyncMeta((m) => m.email);
  const plus = usePlus();
  const setGoal = useQuranProgress((q) => q.setGoalMinutes);

  return (
    <Screen gap={20}>
      <ScreenHeader title={L.t('settings.title')} />

      <View style={{ gap: 8 }}>
        <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
          {L.t('settings.language')}
        </Txt>
        <Segmented<Lang> value={s.language} onChange={(language) => s.set({ language })} options={LANGS.map((l) => ({ value: l.code, label: l.name }))} />
      </View>

      <View style={{ gap: 8 }}>
        <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
          {L.t('settings.name')}
        </Txt>
        <Field placeholder={L.t('settings.namePh')} value={s.displayName} onChangeText={s.setDisplayName} autoCapitalize="words" maxLength={40} />
      </View>

      <View style={{ gap: 8 }}>
        <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
          {L.t('settings.appearance')}
        </Txt>
        <Segmented<ThemeMode>
          value={s.themeMode}
          onChange={s.setThemeMode}
          options={[
            { value: 'light', label: L.t('settings.light') },
            { value: 'dark', label: L.t('settings.dark') },
            { value: 'system', label: L.t('settings.auto') },
          ]}
        />
        <Segmented<DarkStyle>
          value={plus ? s.darkStyle : 'graphite'}
          onChange={(darkStyle) => (darkStyle === 'midnight' && !plus ? router.push('/plus') : s.set({ darkStyle }))}
          options={[
            { value: 'graphite', label: L.t('settings.graphite') },
            { value: 'midnight', label: `${L.t('settings.midnight')} ✦` },
          ]}
        />
        <Txt variant="caption" tone="muted" style={{ paddingHorizontal: 6 }}>
          {L.t('settings.midnightNote')}
        </Txt>
      </View>

      <ListGroup>
        <ListRow icon="sparkles" title={L.t('settings.plus')} value={plus ? L.t('settings.plusOn') : undefined} onPress={() => router.push('/plus')} />
        <ListRow icon="cloud" title={L.t('settings.account')} value={accountEmail ?? L.t('settings.accountOff')} onPress={() => router.push('/settings/account')} last />
      </ListGroup>

      <ListGroup title={L.t('settings.prayer')}>
        <ListRow icon="mapPin" title={L.t('settings.location')} value={s.location.city} onPress={() => router.push('/settings/location')} />
        <ListRow icon="sliders" title={L.t('settings.calcAlerts')} value={L.t(`method.${s.method}`)} onPress={() => router.push('/settings/prayer')} />
        <ListRow icon="grid" title={L.t('settings.widget')} onPress={() => router.push('/settings/widget')} last />
      </ListGroup>

      <ListGroup title={L.t('settings.quran')}>
        <ListRow
          icon="target"
          title={L.t('settings.goal')}
          right={<Stepper label={L.t('settings.goal')} value={goal} min={5} max={120} step={5} format={(v) => L.t('common.minutes', { n: v })} onChange={setGoal} />}
          last
        />
      </ListGroup>

      <ListGroup title={L.t('settings.app')}>
        <ListRow
          icon="sunMoon"
          title={L.t('settings.welcomeAgain')}
          onPress={() => {
            s.set({ onboarded: false });
            router.replace('/onboarding');
          }}
          last={!PRIVACY_URL}
        />
        {PRIVACY_URL && TERMS_URL && (
          <>
            <ListRow icon="shield" title={L.t('legal.privacy')} onPress={() => Linking.openURL(PRIVACY_URL!)} />
            <ListRow icon="scroll" title={L.t('legal.terms')} onPress={() => Linking.openURL(TERMS_URL!)} last />
          </>
        )}
      </ListGroup>

      <ListGroup title={L.t('settings.sources')} footer={L.t('settings.sourcesFooter')}>
        {SOURCES.map(([what, from], i) => (
          <ListRow key={what} title={L.t(what)} subtitle={from} last={i === SOURCES.length - 1} />
        ))}
      </ListGroup>

      <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
        {L.t('settings.version', { app: L.t('app.name'), v: L.num(Constants.expoConfig?.version ?? '') })}
      </Txt>
    </Screen>
  );
}
