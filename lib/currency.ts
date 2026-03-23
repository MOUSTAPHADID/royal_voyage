/**
 * currency.ts — خدمة تحويل العملات
 * العملة الرئيسية: الأوقية الموريتانية (MRU)
 * سعر الصرف التقريبي: 1 USD ≈ 39.5 MRU
 */

const USD_TO_MRU = 39.5;
const EUR_TO_MRU = 43.0;

export function toMRU(amount: number, fromCurrency: string = "USD"): number {
  const currency = fromCurrency.toUpperCase();
  switch (currency) {
    case "MRU": return amount;
    case "USD": return Math.round(amount * USD_TO_MRU);
    case "EUR": return Math.round(amount * EUR_TO_MRU);
    case "GBP": return Math.round(amount * 50.2);
    case "SAR": return Math.round(amount * 10.5);
    case "AED": return Math.round(amount * 10.75);
    case "MAD": return Math.round(amount * 3.95);
    default: return Math.round(amount * USD_TO_MRU);
  }
}

export function formatMRU(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString("ar-MR");
  return `${formatted} أوق`;
}

export function formatAmadeusPriceMRU(priceStr: string, currency: string = "EUR"): string {
  const amount = parseFloat(priceStr);
  if (isNaN(amount)) return "— أوق";
  return formatMRU(toMRU(amount, currency));
}

export function formatPriceMRU(amount: number, currency: string = "EUR"): string {
  return formatMRU(toMRU(amount, currency));
}
