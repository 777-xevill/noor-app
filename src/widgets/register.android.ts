import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './taskHandler.android';

export function registerWidgets() {
  registerWidgetTaskHandler(widgetTaskHandler);
}
