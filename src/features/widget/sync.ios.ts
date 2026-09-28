import { prayerTimesWidget } from '@/widgets/PrayerTimesWidget';
import { currentWidgetInput } from './input';
import { widgetTimeline } from './snapshot';

/** Hand the widget the next few days at once; it moves to each prayer by itself. */
export async function syncWidgets() {
  const input = currentWidgetInput();
  if (input) prayerTimesWidget.updateTimeline(widgetTimeline(new Date(), input));
  else prayerTimesWidget.reload();
}
