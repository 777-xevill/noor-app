import { Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { usePlusStore } from './store';

// Noor Plus through RevenueCat. Switched on by the public SDK keys (see .env.example); without
// them nothing is sold and the Plus screen says so. The entitlement is named "plus".

const ENTITLEMENT = 'plus';
const key = Platform.select({ ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY, android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY });

export const billingEnabled = !!key;

let configured = false;

type Info = { entitlements: { active: Record<string, unknown> } };
const remember = (info: Info) => usePlusStore.getState().set({ active: ENTITLEMENT in info.entitlements.active });

export function startBilling() {
  if (!key || configured) return;
  configured = true;
  Purchases.configure({ apiKey: key });
  Purchases.addCustomerInfoUpdateListener(remember);
  Purchases.getCustomerInfo().then(remember).catch(() => {});
}

export type Plan = { id: string; kind: 'annual' | 'monthly' | 'lifetime' | 'other'; price: string; pkg: PurchasesPackage };

export async function getPlans(): Promise<Plan[]> {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  const kinds: Record<string, Plan['kind']> = { ANNUAL: 'annual', MONTHLY: 'monthly', LIFETIME: 'lifetime' };
  return (offerings.current?.availablePackages ?? []).map((pkg) => ({
    id: pkg.identifier,
    kind: kinds[pkg.packageType] ?? 'other',
    price: pkg.product.priceString,
    pkg,
  }));
}

/** Returns false if the person cancelled. */
export async function buy(plan: Plan): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
    remember(customerInfo);
    return true;
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return false;
    throw e;
  }
}

export async function restore(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  remember(info);
  return ENTITLEMENT in info.entitlements.active;
}

export const manageUrl = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
});
