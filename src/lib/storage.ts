import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

// Storage can be unavailable (private browsing, blocked site data). Never let that crash the app:
// a failed read behaves like a fresh install and a failed write is dropped.
const safe: StateStorage = {
  getItem: async (name) => {
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {}
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {}
  },
};

export const persistStorage = createJSONStorage(() => safe);

type Persisted = { persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void } };

/** Resolves once a persisted store has loaded its saved state. */
export const whenHydrated = (store: Persisted) =>
  new Promise<void>((resolve) => {
    if (store.persist.hasHydrated()) resolve();
    else store.persist.onFinishHydration(() => resolve());
  });
