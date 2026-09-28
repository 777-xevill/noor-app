import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { seedDemoData } from '@/features/demo/seed';
import { usePrayerLog } from '@/features/prayer/log';
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
    Promise.all([hydrated(useSettings), hydrated(usePrayerLog), hydrated(useQuranProgress)]).then(() => {
      seedDemoData();
      setReady(true);
    });
  }, []);
  return ready;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);
  const storesReady = useStoresReady();
  const t = useTheme();

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
