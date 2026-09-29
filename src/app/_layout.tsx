import { useEffect, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { seedDemoData } from '@/features/demo/seed';
import { useSavedDuas } from '@/features/duas/data';
import { useFasting } from '@/features/fasting/store';
import { useJournal } from '@/features/journal/store';
import { useRamadan } from '@/features/ramadan/store';
import { useRewards } from '@/features/rewards/store';
import { useTasbih } from '@/features/tasbih/store';
import { useZakat } from '@/features/zakat/store';
import { usePrayerLog } from '@/features/prayer/log';
import { reschedulePrayerAlerts } from '@/features/prayer/notifications';
import { useQuranProgress } from '@/features/quran/progress';
import { useSettings } from '@/features/settings/store';
import { startBilling } from '@/features/premium/billing';
import { usePlusStore } from '@/features/premium/store';
import { useGiving } from '@/features/donate/store';
import { startCloudSync } from '@/features/sync/engine';
import { useSyncMeta } from '@/features/sync/store';
import { syncWidgets } from '@/features/widget/sync';
import { whenHydrated } from '@/lib/storage';
import { fontAssets } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

function useStoresReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Every persisted store must be loaded before the first screen renders, so nothing flashes empty
    // and no early write can overwrite saved data.
    Promise.all([useSettings, usePrayerLog, useQuranProgress, useJournal, useFasting, useTasbih, useZakat, useSavedDuas, useRamadan, useRewards, useSyncMeta, usePlusStore, useGiving].map(whenHydrated)).then(() => {
      seedDemoData();
      setReady(true);
    });
  }, []);
  return ready;
}

/**
 * Keep scheduled prayer alerts and the home-screen widget in step with settings, and roll both
 * forward on every return to the app.
 */
function usePrayerAlerts(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const plan = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        reschedulePrayerAlerts().catch(() => {});
        syncWidgets().catch(() => {});
      }, 400);
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
    const unsubscribeRamadan = useRamadan.subscribe((r, prev) => {
      if (r.sehriMargin !== prev.sehriMargin || r.sehriReminder !== prev.sehriReminder || r.iftarAlert !== prev.iftarAlert) plan();
    });
    const appState = AppState.addEventListener('change', (state) => state === 'active' && plan());
    return () => {
      clearTimeout(timer);
      unsubscribe();
      unsubscribeRamadan();
      appState.remove();
    };
  }, [enabled]);
}

// Keep the launch screen up until fonts and saved data are ready, so the first frame is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);
  const storesReady = useStoresReady();
  const t = useTheme();
  usePrayerAlerts(storesReady && Platform.OS !== 'web');
  useEffect(() => (storesReady ? startCloudSync() : undefined), [storesReady]);
  useEffect(() => {
    if (storesReady) startBilling();
  }, [storesReady]);

  const ready = fontsLoaded && storesReady;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: t.canvas }} />;

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
