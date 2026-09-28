// The adhan alert sound. Notification sounds are capped at 30 seconds on iOS (longer files fall
// back to the default sound), so the clip is the opening takbīr, which is the same for every
// prayer, Fajr included. Registered with the expo-notifications config plugin in app.json;
// provenance and processing are in assets/sounds/README.md.

/** File name the OS knows the sound by (iOS bundle / Android res/raw). */
export const ADHAN_SOUND = 'adhan.wav';

/** The same file, for playing inside the app. */
export const ADHAN_ASSET = require('../../../assets/sounds/adhan.wav');

/** Rounded length of the clip, for display. */
export const ADHAN_SECONDS = 30;

/** Shown in Settings → Sources. */
export const ADHAN_CREDIT = '“Beautiful adhan” by Adam-synagda, Wikimedia Commons (CC0)';
