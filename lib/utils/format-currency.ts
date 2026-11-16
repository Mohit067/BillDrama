import type { CurrencyCode } from "@/types/trip";
import { getCurrency, minorFactor, minorToMajorString } from "@/lib/calculations/money-utils";

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(code: CurrencyCode, fractionDigits: number, display: "symbol" | "code"): Intl.NumberFormat {
  const key = `${code}:${fractionDigits}:${display}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    const currency = getCurrency(code);
    formatter = new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: code,
      currencyDisplay: display === "code" ? "code" : "narrowSymbol",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

export interface FormatMoneyOptions {
  /** Always print decimals (₹4,000.00). By default they are hidden for whole amounts (₹4,000). */
  alwaysShowDecimals?: boolean;
  /** Prefix positive values with "+". */
  signed?: boolean;
  /** Use the ISO code instead of the symbol (e.g. "INR 4,000") — handy for PDFs. */
  display?: "symbol" | "code";
}

/** Formats integer minor units as a localized currency string. */
export function formatMoney(minor: number, code: CurrencyCode, options: FormatMoneyOptions = {}): string {
  const currency = getCurrency(code);
  const digits = currency.minorUnitDigits;
  const isWhole = minor % minorFactor(digits) === 0;
  const fractionDigits = options.alwaysShowDecimals || !isWhole ? digits : 0;

  // Build the number from an exact decimal string so no float rounding sneaks in.
  const major = Number(minorToMajorString(Math.abs(minor), digits));
  const formatted = getFormatter(code, fractionDigits, options.display ?? "symbol")
    .format(major)
    .replace(/ /g, " ");

  if (minor < 0) return `-${formatted}`;
  if (options.signed && minor > 0) return `+${formatted}`;
  return formatted;
}

/** Plain number without the currency symbol, e.g. "20,000" or "100.50". */
export function formatAmountOnly(minor: number, code: CurrencyCode): string {
  const currency = getCurrency(code);
  const digits = currency.minorUnitDigits;
  const isWhole = minor % minorFactor(digits) === 0;
  return new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: isWhole ? 0 : digits,
    maximumFractionDigits: isWhole ? 0 : digits,
  }).format(Number(minorToMajorString(minor, digits)));
}
