import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { whenHydrated } from '@/lib/storage';
import { useSettings } from '@/features/settings/store';
import { currentWidgetInput } from '@/features/widget/input';
import { widgetSnapshot } from '@/features/widget/snapshot';
import { renderPrayerWidget } from './PrayerTimesAndroid';

/** Runs headless when Android adds, resizes or periodically refreshes the widget. */
export async function widgetTaskHandler({ widgetInfo, widgetAction, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
  await whenHydrated(useSettings);
  const input = currentWidgetInput();
  renderWidget(renderPrayerWidget(input ? widgetSnapshot(new Date(), input) : null, widgetInfo.width));
}
