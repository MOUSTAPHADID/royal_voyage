/**
 * currency.ts — Currency conversion utilities for Royal Voyage
 *
 * Primary display currency: MRU (Mauritanian Ouguiya / الأوقية الموريتانية)
 * Fallback: USD
 *
 * Exchange rates (approximate, updated 2026-03):
 *   1 USD  ≈ 39.5 MRU
 *   1 EUR  ≈ 43.0 MRU
 *   1 AED  ≈ 10.75 MRU
 *   1 GBP  ≈ 50.0 MRU
 *   1 MAD  ≈ 3.95 MRU
 *   1 SAR  ≈ 10.5 MRU
 *   1 QAR  ≈ 10.8 MRU
 */

export const EXCHANGE_RATES: Record<string, number> = {
  USD: 39.5,
  EUR: 43.0,
  AED: 10.75,
  GBP: 50.0,
  MAD: 3.95,
  SAR: 10.5,
  QAR: 10.8,
  MRU: 1,
};

/**
 * Convert an amount from any currency to MRU.
 */
export function toMRU(amount: number, fromCurrency: string = "USD"): number {
  const rate = EXCHANGE_RATES[fromCurrency.toUpperCase()] ?? EXCHANGE_RATES.USD;
  return Math.round(amount * rate);
}

/**
 * Format a price in MRU with the Mauritanian symbol.
 * Example: formatMRU(15000) → "15,000 أوق"
 */
export function formatMRU(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString("ar-MR");
  return `${formatted} أوق`;
}

/**
 * Format a price in its original currency, then show MRU equivalent.
 * Example: formatWithMRU(391.1, "USD") → "$391 · 15,448 أوق"
 */
export function formatWithMRU(amount: number, currency: string = "USD"): string {
  const symbol = getCurrencySymbol(currency);
  const mruAmount = toMRU(amount, currency);
  return `${symbol}${Math.round(amount).toLocaleString()} · ${formatMRU(mruAmount)}`;
}

/**
 * Format a price in MRU only (primary display).
 * Example: formatPriceMRU(391.1, "USD") → "15,448 أوق"
 */
export function formatPriceMRU(amount: number, currency: string = "USD"): string {
  return formatMRU(toMRU(amount, currency));
}

/**
 * Get currency symbol for display.
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "د.إ ",
    MAD: "د.م. ",
    SAR: "﷼ ",
    QAR: "ر.ق ",
    MRU: "",
  };
  return symbols[currency.toUpperCase()] ?? (currency + " ");
}
