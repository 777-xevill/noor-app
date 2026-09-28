import { useEffect, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { seedDemoData } from '@/features/demo/seed';
import { useSavedDuas } from '@/features/duas/data';
import { useFasting } from '@/features/fasting/store';
import { useJournal } from '@/features/journal/store';
import { useTasbih } from '@/features/tasbih/store';
import { useZakat } from '@/features/zakat/store';
import { usePrayerLog } from '@/features/prayer/log';
import { reschedulePrayerAlerts } from '@/features/prayer/notifications';
import { useQuranProgress } from '@/features/quran/progress';
import { useSettings } from '@/features/settings/store';
import { fontAssets } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

type Persisted = { persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void } };

const hydrated = (store: Persisted) =>
  new Promise<void>((resolve) => {
    if (store.persist.hasHydrated()) resolve();
    else store.persist.onFinishHydration(() => resolve());
  });

function useStoresReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Every persisted store must be loaded before the first screen renders, so nothing flashes empty
    // and no early write can overwrite saved data.
    Promise.all([useSettings, usePrayerLog, useQuranProgress, useJournal, useFasting, useTasbih, useZakat, useSavedDuas].map(hydrated)).then(() => {
      seedDemoData();
      setReady(true);
    });
  }, []);
  return ready;
}

/** Keep scheduled prayer alerts in step with settings, and roll the window forward on every return to the app. */
function usePrayerAlerts(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const plan = () => {
      clearTimeout(timer);
      timer = setTimeout(() => reschedulePrayerAlerts().catch(() => {}), 400);
    };
    plan();
    const unsubscribe = useSettings.subscribe((s, prev) => {
      if (
        s.location !== prev.location ||
        s.method !== prev.method ||
        s.madhab !== prev.madhab ||
        s.highLatitude !== prev.highLatitude ||
        s.adjustments !== prev.adjustments ||
        s.hijriOffset !== prev.hijriOffset ||
        s.alerts !== prev.alerts ||
        s.reminderBefore !== prev.reminderBefore ||
        s.onboarded !== prev.onboarded ||
        s.language !== prev.language
      )
        plan();
    });
    const appState = AppState.addEventListener('change', (state) => state === 'active' && plan());
    return () => {
      clearTimeout(timer);
      unsubscribe();
      appState.remove();
    };
  }, [enabled]);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);
  const storesReady = useStoresReady();
  const t = useTheme();
  usePrayerAlerts(storesReady && Platform.OS !== 'web');

  if (!fontsLoaded || !storesReady) return <View style={{ flex: 1, backgroundColor: t.canvas }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      {/* On a wide browser window, keep the app at phone width instead of stretching it. */}
      <View style={{ flex: 1, backgroundColor: t.canvas, alignItems: 'center' }}>
        <View style={{ flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 480 : undefined }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.canvas } }} />
        </View>
      </View>
    </SafeAreaProvider>
  );
}
