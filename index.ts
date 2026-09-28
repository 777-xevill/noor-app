// App entry: Expo Router, plus the Android widget's background task, which has to be registered
// before any screen mounts.
import 'expo-router/entry';
import { registerWidgets } from './src/widgets/register';

registerWidgets();
