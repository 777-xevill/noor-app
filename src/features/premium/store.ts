import { Platform } from 'react-native';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

type PlusState = {
  /** The store says this person has Noor Plus. Cached so perks work offline; refreshed on launch. */
  active: boolean;
  /** Demo builds only: try the perks without buying, clearly labelled as a preview. */
  preview: boolean;
  set: (patch: Partial<Pick<PlusState, 'active' | 'preview'>>) => void;
};

export const usePlusStore = create<PlusState>()(
  persist((set) => ({ active: false, preview: false, set: (patch) => set(patch) }), { name: 'noor.plus', storage: persistStorage, version: 1 }),
);

/** Plus is on sale only in builds given a RevenueCat key. Until then its perks are simply open to everyone. */
export const plusOnSale = !!Platform.select({ ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY, android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY });

/** Whether Plus perks are on. */
export const usePlus = () => usePlusStore((s) => s.active || s.preview || !plusOnSale);
