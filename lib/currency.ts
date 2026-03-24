/**
 * currency.ts — خدمة تحويل العملات
 * العملة الرئيسية: الأوقية الموريتانية (MRU)
 * سعر الصرف التقريبي: 1 USD ≈ 39.5 MRU
 *
 * ملاحظة: جميع الأرقام تُعرض باللاتينية (0-9)
 */

const USD_TO_MRU = 39.5;
const EUR_TO_MRU = 43.0;
const AOA_TO_MRU = 0.043; // 1 AOA ≈ 0.043 MRU (1 MRU ≈ 23.3 AOA)

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

/** تحويل من عملة مصدر إلى MRU */
export function toMRU(amount: number, fromCurrency: string = "USD"): number {
  const currency = fromCurrency.toUpperCase();
  switch (currency) {
    case "MRU": return amount;
    case "USD": return Math.round(amount * USD_TO_MRU);
    case "EUR": return Math.round(amount * EUR_TO_MRU);
    case "AOA": return Math.round(amount * AOA_TO_MRU);
    case "GBP": return Math.round(amount * 50.2);
    case "SAR": return Math.round(amount * 10.5);
    case "AED": return Math.round(amount * 10.75);
    case "MAD": return Math.round(amount * 3.95);
    default: return Math.round(amount * USD_TO_MRU);
  }
}

/** تحويل من MRU إلى عملة مستهدفة */
export function fromMRU(amountMRU: number, toCurrency: AppCurrency): number {
  switch (toCurrency) {
    case "MRU": return amountMRU;
    case "USD": return amountMRU / USD_TO_MRU;
    case "EUR": return amountMRU / EUR_TO_MRU;
    case "AOA": return amountMRU / AOA_TO_MRU;
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
