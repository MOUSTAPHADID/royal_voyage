/**
 * pricing-settings.ts — إعدادات التسعير القابلة للتعديل
 * تُحفظ في AsyncStorage وتُستخدم في جميع شاشات التسعير
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "royal_voyage_pricing_settings";

// رموز المطارات الموريتانية للكشف عن الرحلات الداخلية
const MAURITANIAN_AIRPORTS = ["NKC", "NDB", "ATR", "KFA", "MOM", "OUZ", "SEY", "THI", "TMD", "ZLG", "AEO", "EMN", "LEG", "MBR", "OGJ"];

export interface PricingSettings {
  /** رسوم الوكالة للرحلات الدولية بالأوقية */
  agencyFeeMRU: number;
  /** رسوم الوكالة للرحلات الداخلية بالأوقية */
  agencyFeeDomesticMRU: number;
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
  /** سعر صرف الكوانزا الأنغولية إلى الأوقية */
  aoaToMRU: number;
  /** خصم سعر الطفل (0.75 = 25% خصم) */
  childDiscountRate: number;
  /** رسوم ترقية المقعد (مساحة إضافية للأرجل) بالأوقية */
  extraLegroomFeeMRU: number;
  /** رسوم تغيير المقعد بعد تسجيل الوصول بالأوقية */
  seatChangeFeeMRU: number;
  /** نسبة الهامش المضافة على سعر Duffel (مثلاً 5 = 5%) — مخفية عن الزبون */
  markupPercent: number;
  /** نسبة هامش الرحلات الداخلية (مثلاً 3 = 3%) — مخفية عن الزبون */
  markupPercentDomestic: number;
  /** تاريخ آخر تحديث لأسعار الصرف */
  ratesLastUpdated?: string;
}

export const DEFAULT_PRICING: PricingSettings = {
  agencyFeeMRU: 1000,
  agencyFeeDomesticMRU: 500,
  usdToMRU: 39.5,
  eurToMRU: 43.0,
  gbpToMRU: 50.2,
  sarToMRU: 10.5,
  aedToMRU: 10.75,
  aoaToMRU: 0.043,
  childDiscountRate: 0.75,
  extraLegroomFeeMRU: 500,
  seatChangeFeeMRU: 300,
  markupPercent: 5,
  markupPercentDomestic: 3,
  ratesLastUpdated: undefined,
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

/** تحديد إذا كانت الرحلة داخلية (كلا المطارين موريتانيان) */
export function isDomesticFlight(originCode: string, destinationCode: string): boolean {
  return (
    MAURITANIAN_AIRPORTS.includes(originCode?.toUpperCase()) &&
    MAURITANIAN_AIRPORTS.includes(destinationCode?.toUpperCase())
  );
}

/** الحصول على رسوم الوكالة المناسبة حسب نوع الرحلة */
export function getAgencyFee(originCode?: string, destinationCode?: string): number {
  const s = getPricingSettings();
  if (originCode && destinationCode && isDomesticFlight(originCode, destinationCode)) {
    return s.agencyFeeDomesticMRU;
  }
  return s.agencyFeeMRU;
}

/** الحصول على نسبة الهامش المناسبة حسب نوع الرحلة */
export function getMarkupPercent(originCode?: string, destinationCode?: string): number {
  const s = getPricingSettings();
  if (originCode && destinationCode && isDomesticFlight(originCode, destinationCode)) {
    return s.markupPercentDomestic;
  }
  return s.markupPercent;
}

/** تطبيق نسبة الهامش على السعر (مخفية عن الزبون) */
export function applyMarkup(priceMRU: number, originCode?: string, destinationCode?: string): number {
  const percent = getMarkupPercent(originCode, destinationCode);
  return Math.round(priceMRU * (1 + percent / 100));
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
    case "AOA": return Math.round(amount * s.aoaToMRU);
    default: return Math.round(amount * s.usdToMRU);
  }
}

/** جلب أسعار الصرف الحية من API مجانية */
export async function fetchLiveExchangeRates(): Promise<Partial<PricingSettings> | null> {
  try {
    // نستخدم exchangerate-api.com (مجاني بدون مفتاح لـ MRO/MRU)
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    const rates = data.rates as Record<string, number>;
    
    // MRU = الأوقية الجديدة (1 USD = X MRU)
    const usdToMRU = rates["MRU"] ?? 39.5;
    
    return {
      usdToMRU: parseFloat(usdToMRU.toFixed(2)),
      eurToMRU: parseFloat((usdToMRU / (rates["EUR"] ?? 0.92)).toFixed(2)),
      gbpToMRU: parseFloat((usdToMRU / (rates["GBP"] ?? 0.79)).toFixed(2)),
      sarToMRU: parseFloat((usdToMRU / (rates["SAR"] ?? 3.75)).toFixed(2)),
      aedToMRU: parseFloat((usdToMRU / (rates["AED"] ?? 3.67)).toFixed(2)),
      aoaToMRU: parseFloat((usdToMRU / (rates["AOA"] ?? 920)).toFixed(4)),
      ratesLastUpdated: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
