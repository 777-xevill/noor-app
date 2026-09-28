import { View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Field } from '@/components/Field';
import { ListGroup, ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { METHOD_LABEL } from '@/features/prayer/location';
import { useQuranProgress } from '@/features/quran/progress';
import { type ThemeMode, useSettings } from '@/features/settings/store';

const SOURCES: [string, string][] = [
  ['Quran (Arabic)', 'Tanzil.net Uthmani text, via api.alquran.cloud'],
  ['Quran (English)', 'Saheeh International'],
  ['Quran (Bangla)', 'Muhiuddin Khan'],
  ['Recitation', 'Mishary Rashid Alafasy, everyayah.com'],
  ['Duas and adhkar', 'Hisnul Muslim (Fortress of the Muslim), Sa’id ibn Ali ibn Wahf al-Qahtani, via hisnmuslim.com'],
  ['99 Names of Allah', 'api.aladhan.com'],
  ['Prayer times and Qibla', 'adhan (Batoul Apps), checked against api.aladhan.com'],
  ['City coordinates', '© OpenStreetMap contributors'],
];

export default function SettingsScreen() {
  const s = useSettings();
  const goal = useQuranProgress((q) => q.goalMinutes);
  const setGoal = useQuranProgress((q) => q.setGoalMinutes);

  return (
    <Screen gap={20}>
      <ScreenHeader title="Settings" />

      <View style={{ gap: 8 }}>
        <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
          Your name
        </Txt>
        <Field placeholder="What should we call you?" value={s.displayName} onChangeText={s.setDisplayName} autoCapitalize="words" maxLength={40} />
      </View>

      <View style={{ gap: 8 }}>
        <Txt variant="eyebrow" tone="muted" style={{ paddingHorizontal: 6 }}>
          Appearance
        </Txt>
        <Segmented<ThemeMode>
          value={s.themeMode}
          onChange={s.setThemeMode}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'Automatic' },
          ]}
        />
      </View>

      <ListGroup title="Prayer">
        <ListRow icon="mapPin" title="Location" value={s.location.city} onPress={() => router.push('/settings/location')} />
        <ListRow icon="sliders" title="Calculation and alerts" value={METHOD_LABEL[s.method]} onPress={() => router.push('/settings/prayer')} last />
      </ListGroup>

      <ListGroup title="Quran">
        <ListRow icon="target" title="Daily reading goal" right={<Stepper label="reading goal" value={goal} min={5} max={120} step={5} format={(v) => `${v} min`} onChange={setGoal} />} last />
      </ListGroup>

      <ListGroup title="App">
        <ListRow icon="sunMoon" title="Show the welcome again" onPress={() => { s.set({ onboarded: false }); router.replace('/onboarding'); }} last />
      </ListGroup>

      <ListGroup title="Sources" footer="Religious text is shown exactly as published by these sources. If you notice an error, please tell us.">
        {SOURCES.map(([what, from], i) => (
          <ListRow key={what} title={what} subtitle={from} last={i === SOURCES.length - 1} />
        ))}
      </ListGroup>

      <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
        Noor {Constants.expoConfig?.version ?? ''} · Your data stays on this device.
      </Txt>
    </Screen>
  );
}
