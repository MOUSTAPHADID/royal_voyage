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
  /** نسبة هامش الدرجة الاقتصادية — دولي (%) */
  markupEconomy: number;
  /** نسبة هامش درجة الأعمال — دولي (%) */
  markupBusiness: number;
  /** نسبة هامش الدرجة الأولى — دولي (%) */
  markupFirst: number;
  /** نسبة هامش الدرجة الاقتصادية — داخلي (%) */
  markupEconomyDomestic: number;
  /** نسبة هامش درجة الأعمال — داخلي (%) */
  markupBusinessDomestic: number;
  /** نسبة هامش الدرجة الأولى — داخلي (%) */
  markupFirstDomestic: number;
  /** تاريخ آخر تحديث لأسعار الصرف */
  ratesLastUpdated?: string;
}

export const DEFAULT_PRICING: PricingSettings = {
  agencyFeeMRU: 1000,
  agencyFeeDomesticMRU: 500,
  // أسعار صرف حقيقية — آخر تحديث: 1 أبريل 2026 (open.er-api.com)
  usdToMRU: 40.08,
  eurToMRU: 46.22,
  gbpToMRU: 53.03,
  sarToMRU: 10.69,
  aedToMRU: 10.91,
  aoaToMRU: 0.0434,
  childDiscountRate: 0.75,
  extraLegroomFeeMRU: 500,
  seatChangeFeeMRU: 300,
  markupEconomy: 5,
  markupBusiness: 10,
  markupFirst: 15,
  markupEconomyDomestic: 3,
  markupBusinessDomestic: 7,
  markupFirstDomestic: 10,
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

/** تطبيع اسم الدرجة من Duffel/Amadeus إلى مفتاح موحد */
function normalizeClass(flightClass?: string): "economy" | "business" | "first" {
  if (!flightClass) return "economy";
  const c = flightClass.toUpperCase();
  if (c.includes("FIRST") || c.includes("PREMIUM_FIRST")) return "first";
  if (c.includes("BUSINESS")) return "business";
  return "economy";
}

/** الحصول على نسبة الهامش المناسبة حسب نوع الرحلة والدرجة */
export function getMarkupPercent(originCode?: string, destinationCode?: string, flightClass?: string): number {
  const s = getPricingSettings();
  const cls = normalizeClass(flightClass);
  const domestic = originCode && destinationCode && isDomesticFlight(originCode, destinationCode);
  if (domestic) {
    if (cls === "first") return s.markupFirstDomestic;
    if (cls === "business") return s.markupBusinessDomestic;
    return s.markupEconomyDomestic;
  }
  if (cls === "first") return s.markupFirst;
  if (cls === "business") return s.markupBusiness;
  return s.markupEconomy;
}

/** تطبيق نسبة الهامش على السعر (مخفية عن الزبون) */
export function applyMarkup(priceMRU: number, originCode?: string, destinationCode?: string, flightClass?: string): number {
  const percent = getMarkupPercent(originCode, destinationCode, flightClass);
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
