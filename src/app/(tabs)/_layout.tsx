import { Redirect, Tabs } from 'expo-router';
import { useSettings } from '@/features/settings/store';
import { FloatingTabBar } from '@/components/FloatingTabBar';

export default function TabsLayout() {
  const onboarded = useSettings((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      // freezeOnBlur: tabs you aren't looking at stop re-rendering (clock ticks, store updates) until you return.
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' }, freezeOnBlur: true }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="prayers" options={{ title: 'Prayers' }} />
      <Tabs.Screen name="quran" options={{ title: 'Quran' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
    </Tabs>
  );
}
