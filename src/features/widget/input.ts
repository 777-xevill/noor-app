import { selectPrayerPrefs, useSettings } from '@/features/settings/store';
import type { WidgetInput } from './snapshot';

/** The widget's inputs from saved settings, or null before setup (the widget then asks to open the app). */
export function currentWidgetInput(): WidgetInput | null {
  const s = useSettings.getState();
  if (!s.onboarded) return null;
  return { loc: s.location, prefs: selectPrayerPrefs(s), hijriOffset: s.hijriOffset, lang: s.language };
}
