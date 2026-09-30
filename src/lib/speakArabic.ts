import * as Speech from 'expo-speech';

// null: not looked up yet; undefined: this phone has no Arabic voice.
let arabicVoice: string | undefined | null = null;

async function findVoice(): Promise<string | undefined> {
  if (arabicVoice !== null) return arabicVoice;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    arabicVoice = voices.find((v) => v.language?.toLowerCase().startsWith('ar'))?.identifier;
  } catch {
    arabicVoice = undefined;
  }
  return arabicVoice;
}

/** Whether the phone has an Arabic text-to-speech voice (false means taps will be silent). */
export async function hasArabicVoice(): Promise<boolean> {
  return !!(await findVoice());
}

/**
 * Read Arabic text aloud with the phone's own Arabic voice (offline, nothing to download here).
 * Slightly slow, for learners. Stops anything still being read first.
 */
export async function speakArabic(text: string, rate = 0.8): Promise<void> {
  Speech.stop();
  const voice = await findVoice();
  Speech.speak(text, { language: 'ar', voice, rate, pitch: 1 });
}

export function stopSpeaking() {
  Speech.stop();
}
