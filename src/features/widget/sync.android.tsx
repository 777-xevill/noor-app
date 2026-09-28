import { requestWidgetUpdate } from 'react-native-android-widget';
import { renderPrayerWidget } from '@/widgets/PrayerTimesAndroid';
import { currentWidgetInput } from './input';
import { widgetSnapshot } from './snapshot';

/** Redraw every placed prayer-times widget with the current settings. */
export async function syncWidgets() {
  const input = currentWidgetInput();
  await requestWidgetUpdate({
    widgetName: 'PrayerTimes',
    renderWidget: (info) => renderPrayerWidget(input ? widgetSnapshot(new Date(), input) : null, info.width),
  });
}
