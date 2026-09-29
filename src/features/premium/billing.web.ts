// Purchases happen in the phone apps only.
export const billingEnabled = false;
export function startBilling() {}
export type Plan = { id: string; kind: 'annual' | 'monthly' | 'lifetime' | 'other'; price: string; pkg: unknown };
export async function getPlans(): Promise<Plan[]> {
  return [];
}
export async function buy(_plan: Plan): Promise<boolean> {
  return false;
}
export async function restore(): Promise<boolean> {
  return false;
}
export const manageUrl: string | undefined = undefined;
