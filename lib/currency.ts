/**
 * currency.ts — خدمة تحويل العملات
 * العملة الرئيسية: الأوقية الموريتانية (MRU)
 * سعر الصرف التقريبي: 1 USD ≈ 39.5 MRU
 *
 * ملاحظة: جميع الأرقام تُعرض باللاتينية (0-9)
 */

// Default fallback rates — Real rates as of 1 Apr 2026 (open.er-api.com)
const USD_TO_MRU_DEFAULT = 40.08;
const EUR_TO_MRU_DEFAULT = 46.22;
const AOA_TO_MRU_DEFAULT = 0.0434; // 1 AOA ≈ 0.0434 MRU

/**
 * رسوم الوكالة الثابتة بالأوقية الموريتانية
 * تُضاف على كل حجز (رحلة أو فندق)
 */
export const AGENCY_FEE_MRU = 1000;

export type AppCurrency = "MRU" | "USD" | "EUR" | "AOA";

export const CURRENCIES: { code: AppCurrency; name: string; symbol: string; flag: string }[] = [
  { code: "MRU", name: "أوقية موريتانية", symbol: "MRU", flag: "🇲🇷" },
  { code: "USD", name: "دولار أمريكي",    symbol: "$",   flag: "🇺🇸" },
  { code: "EUR", name: "يورو",             symbol: "€",   flag: "🇪🇺" },
  { code: "AOA", name: "كوانزا أنغولي",   symbol: "Kz",  flag: "🇦🇴" },
];

/**
 * تحويل من عملة مصدر إلى MRU
 * يستخدم أسعار الصرف من PricingSettings (إن وُجدت) لضمان توحيد السعر عبر جميع الشاشات
 */
export function toMRU(amount: number, fromCurrency: string = "USD"): number {
  const currency = fromCurrency.toUpperCase();
  // Try to use dynamic rates from PricingSettings
  let rates: { usdToMRU: number; eurToMRU: number; gbpToMRU: number; sarToMRU: number; aedToMRU: number } | null = null;
  try {
    // Dynamic import to avoid circular dependency
    const { getPricingSettings } = require("./pricing-settings");
    const s = getPricingSettings();
    if (s) rates = s;
  } catch {
    // fallback to defaults
  }
  const usdRate = rates?.usdToMRU ?? USD_TO_MRU_DEFAULT;
  const eurRate = rates?.eurToMRU ?? EUR_TO_MRU_DEFAULT;
  const gbpRate = rates?.gbpToMRU ?? 50.2;
  const sarRate = rates?.sarToMRU ?? 10.5;
  const aedRate = rates?.aedToMRU ?? 10.75;
  const aoaRate = (rates as any)?.aoaToMRU ?? AOA_TO_MRU_DEFAULT;
  switch (currency) {
    case "MRU": return amount;
    case "USD": return Math.round(amount * usdRate);
    case "EUR": return Math.round(amount * eurRate);
    case "AOA": return Math.round(amount * aoaRate);
    case "GBP": return Math.round(amount * gbpRate);
    case "SAR": return Math.round(amount * sarRate);
    case "AED": return Math.round(amount * aedRate);
    case "MAD": return Math.round(amount * (usdRate / 10));
    default: return Math.round(amount * usdRate);
  }
}

/** تحويل من MRU إلى عملة مستهدفة */
export function fromMRU(amountMRU: number, toCurrency: AppCurrency): number {
  let rates: { usdToMRU: number; eurToMRU: number; aoaToMRU?: number } | null = null;
  try {
    const { getPricingSettings } = require("./pricing-settings");
    const s = getPricingSettings();
    if (s) rates = s;
  } catch {
    // fallback
  }
  const usdRate = rates?.usdToMRU ?? USD_TO_MRU_DEFAULT;
  const eurRate = rates?.eurToMRU ?? EUR_TO_MRU_DEFAULT;
  const aoaRate = rates?.aoaToMRU ?? AOA_TO_MRU_DEFAULT;
  switch (toCurrency) {
    case "MRU": return amountMRU;
    case "USD": return amountMRU / usdRate;
    case "EUR": return amountMRU / eurRate;
    case "AOA": return amountMRU / aoaRate;
    default: return amountMRU;
  }
}

/** تنسيق مبلغ بالأوقية الموريتانية */
export function formatMRU(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString("en-US");
  return `${formatted} MRU`;
}

/** تنسيق مبلغ بأي عملة مدعومة */
export function formatCurrency(amountMRU: number, currency: AppCurrency = "MRU"): string {
  const converted = fromMRU(amountMRU, currency);
  const info = CURRENCIES.find((c) => c.code === currency)!;
  switch (currency) {
    case "MRU": {
      const rounded = Math.round(converted);
      return `${rounded.toLocaleString("en-US")} MRU`;
    }
    case "USD": {
      const rounded = Math.round(converted * 100) / 100;
      return `$${rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    case "EUR": {
      const rounded = Math.round(converted * 100) / 100;
      return `€${rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    case "AOA": {
      const rounded = Math.round(converted);
      return `${rounded.toLocaleString("en-US")} Kz`;
    }
    default:
      return `${Math.round(converted).toLocaleString("en-US")} ${info.symbol}`;
  }
}

export function formatAmadeusPriceMRU(priceStr: string, currency: string = "EUR"): string {
  const amount = parseFloat(priceStr);
  if (isNaN(amount)) return "— MRU";
  return formatMRU(toMRU(amount, currency));
}

export function formatPriceMRU(amount: number, currency: string = "EUR"): string {
  return formatMRU(toMRU(amount, currency));
}
