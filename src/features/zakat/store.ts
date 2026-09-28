import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

/** 1 tola / bhori (vori) = 11.664 g */
export const GRAMS_PER_TOLA = 11.664;
/** Nisab: 7.5 tola of gold (87.48 g) or 52.5 tola of silver (612.36 g). */
export const NISAB_GRAMS = { gold: 7.5 * GRAMS_PER_TOLA, silver: 52.5 * GRAMS_PER_TOLA };
export const ZAKAT_RATE = 0.025;

export type ZakatInputs = {
  cash: string;
  bank: string;
  goldWeight: string;
  silverWeight: string;
  business: string;
  investments: string;
  receivable: string;
  other: string;
  debts: string;
  goldPrice: string;
  silverPrice: string;
};

type ZakatState = {
  currency: string;
  basis: 'silver' | 'gold';
  unit: 'gram' | 'tola';
  inputs: ZakatInputs;
  set: (patch: Partial<Omit<ZakatState, 'set' | 'setInput' | 'reset'>>) => void;
  setInput: (key: keyof ZakatInputs, value: string) => void;
  reset: () => void;
};

const EMPTY: ZakatInputs = {
  cash: '',
  bank: '',
  goldWeight: '',
  silverWeight: '',
  business: '',
  investments: '',
  receivable: '',
  other: '',
  debts: '',
  goldPrice: '',
  silverPrice: '',
};

export const useZakat = create<ZakatState>()(
  persist(
    (set) => ({
      currency: 'BDT',
      basis: 'silver',
      unit: 'tola',
      inputs: EMPTY,
      set: (patch) => set(patch),
      setInput: (key, value) => set((s) => ({ inputs: { ...s.inputs, [key]: value } })),
      reset: () => set({ inputs: EMPTY }),
    }),
    { name: 'noor.zakat', storage: persistStorage, version: 1 },
  ),
);

export const num = (v: string) => {
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function computeZakat(s: Pick<ZakatState, 'basis' | 'unit' | 'inputs'>) {
  const i = s.inputs;
  const toGrams = (w: number) => (s.unit === 'tola' ? w * GRAMS_PER_TOLA : w);
  const perGram = (p: number) => (s.unit === 'tola' ? p / GRAMS_PER_TOLA : p);
  const goldPerGram = perGram(num(i.goldPrice));
  const silverPerGram = perGram(num(i.silverPrice));

  const goldValue = toGrams(num(i.goldWeight)) * goldPerGram;
  const silverValue = toGrams(num(i.silverWeight)) * silverPerGram;
  const assets = num(i.cash) + num(i.bank) + goldValue + silverValue + num(i.business) + num(i.investments) + num(i.receivable) + num(i.other);
  const debts = num(i.debts);
  const net = Math.max(0, assets - debts);

  const nisabPricePerGram = s.basis === 'gold' ? goldPerGram : silverPerGram;
  const nisab = nisabPricePerGram > 0 ? NISAB_GRAMS[s.basis] * nisabPricePerGram : null;
  const due = nisab !== null && net >= nisab ? net * ZAKAT_RATE : 0;
  const missingGoldPrice = num(i.goldWeight) > 0 && goldPerGram === 0;
  const missingSilverPrice = num(i.silverWeight) > 0 && silverPerGram === 0;
  return { assets, debts, net, nisab, due, goldValue, silverValue, missingGoldPrice, missingSilverPrice };
}
