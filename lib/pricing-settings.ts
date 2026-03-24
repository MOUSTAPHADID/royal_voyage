/**
 * pricing-settings.ts — إعدادات التسعير القابلة للتعديل
 * تُحفظ في AsyncStorage وتُستخدم في جميع شاشات التسعير
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "royal_voyage_pricing_settings";

export interface PricingSettings {
  /** رسوم الوكالة بالأوقية المضافة على كل حجز */
  agencyFeeMRU: number;
  /** سعر صرف الدولار إلى الأوقية */
  usdToMRU: number;
  /** سعر صرف اليورو إلى الأوقية */
  eurToMRU: number;
  /** سعر صرف الجنيه الإسترليني إلى الأوقية */
  gbpToMRU: number;
  /** سعر صرف الريال السعودي إلى الأوقية */
  sarToMRU: number;
  /** سعر صرف الدرهم الإماراتي إلى الأوقية */
  aedToMRU: number;
  /** خصم سعر الطفل (0.75 = 25% خصم) */
  childDiscountRate: number;
}

export const DEFAULT_PRICING: PricingSettings = {
  agencyFeeMRU: 1000,
  usdToMRU: 39.5,
  eurToMRU: 43.0,
  gbpToMRU: 50.2,
  sarToMRU: 10.5,
  aedToMRU: 10.75,
  childDiscountRate: 0.75,
};

let _cached: PricingSettings | null = null;
const _listeners: Array<(s: PricingSettings) => void> = [];

export async function loadPricingSettings(): Promise<PricingSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PricingSettings>;
      _cached = { ...DEFAULT_PRICING, ...parsed };
    } else {
      _cached = { ...DEFAULT_PRICING };
    }
  } catch {
    _cached = { ...DEFAULT_PRICING };
  }
  return _cached;
}

export async function savePricingSettings(settings: PricingSettings): Promise<void> {
  _cached = settings;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  _listeners.forEach((fn) => fn(settings));
}

export function getPricingSettings(): PricingSettings {
  return _cached ?? { ...DEFAULT_PRICING };
}

export function subscribePricingSettings(fn: (s: PricingSettings) => void): () => void {
  _listeners.push(fn);
  return () => {
    const idx = _listeners.indexOf(fn);
    if (idx !== -1) _listeners.splice(idx, 1);
  };
}

/** تحويل مبلغ من عملة معينة إلى الأوقية باستخدام الإعدادات الحالية */
export function toMRUWithSettings(amount: number, fromCurrency: string = "USD"): number {
  const s = getPricingSettings();
  const currency = fromCurrency.toUpperCase();
  switch (currency) {
    case "MRU": return Math.round(amount);
    case "USD": return Math.round(amount * s.usdToMRU);
    case "EUR": return Math.round(amount * s.eurToMRU);
    case "GBP": return Math.round(amount * s.gbpToMRU);
    case "SAR": return Math.round(amount * s.sarToMRU);
    case "AED": return Math.round(amount * s.aedToMRU);
    default: return Math.round(amount * s.usdToMRU);
  }
}
