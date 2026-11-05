// expo-location always declares a background location service. Noor only reads location while it's open, so
// remove the service from the manifest; otherwise Google Play can ask for a foreground service declaration.
const { withAndroidManifest } = require('expo/config-plugins');

const SERVICE = 'expo.modules.location.services.LocationTaskService';

module.exports = (config) =>
  withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application?.[0];
    if (!app) return c;
    app.service = app.service ?? [];
    if (!app.service.some((s) => s.$['android:name'] === SERVICE)) {
      app.service.push({ $: { 'android:name': SERVICE, 'tools:node': 'remove' } });
    }
    c.modResults.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    return c;
  });
