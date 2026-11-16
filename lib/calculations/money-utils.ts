import type { CurrencyCode, CurrencyInfo } from "@/types/trip";

/**
 * Supported currencies. `minorUnitDigits` drives every conversion between what
 * the user types (major units, e.g. "100.50") and what the engine computes with
 * (integer minor units, e.g. 10050 paise).
 */
export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  INR: { code: "INR", symbol: "₹", label: "Indian Rupee", locale: "en-IN", minorUnitDigits: 2, flag: "🇮🇳" },
  USD: { code: "USD", symbol: "$", label: "US Dollar", locale: "en-US", minorUnitDigits: 2, flag: "🇺🇸" },
  EUR: { code: "EUR", symbol: "€", label: "Euro", locale: "en-IE", minorUnitDigits: 2, flag: "🇪🇺" },
  GBP: { code: "GBP", symbol: "£", label: "British Pound", locale: "en-GB", minorUnitDigits: 2, flag: "🇬🇧" },
  JPY: { code: "JPY", symbol: "¥", label: "Japanese Yen", locale: "en-US", minorUnitDigits: 0, flag: "🇯🇵" },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];
export const DEFAULT_CURRENCY: CurrencyCode = "INR";

/** Upper bound per person (in major units) – keeps everything far below Number.MAX_SAFE_INTEGER. */
export const MAX_AMOUNT_MAJOR = 1_000_000_000;

export function getCurrency(code: CurrencyCode): CurrencyInfo {
  return CURRENCIES[code] ?? CURRENCIES[DEFAULT_CURRENCY];
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && value in CURRENCIES;
}

export function minorFactor(digits: number): number {
  return 10 ** digits;
}

/**
 * Parses a strictly-formatted, non-negative decimal string into integer minor
 * units using pure string/integer maths (no floating point involved).
 *
 *   parseMajorToMinor("100.5", 2)  → 10050
 *   parseMajorToMinor("0", 2)      → 0
 *   parseMajorToMinor("1.234", 2)  → null (too many decimals)
 *   parseMajorToMinor("-5", 2)     → null
 */
export function parseMajorToMinor(input: string, digits: number): number | null {
  const value = input.trim();
  const pattern = digits > 0 ? new RegExp(`^(\\d+)(?:\\.(\\d{0,${digits}}))?$`) : /^(\d+)$/;
  const match = pattern.exec(value);
  if (!match) return null;

  const whole = Number(match[1]);
  const fraction = (match[2] ?? "").padEnd(digits, "0");
  const fractionValue = digits > 0 ? Number(fraction) : 0;
  const minor = whole * minorFactor(digits) + fractionValue;

  if (!Number.isSafeInteger(minor)) return null;
  return minor;
}

/** Converts integer minor units back into a plain decimal string, e.g. 10050 → "100.50". */
export function minorToMajorString(minor: number, digits: number): string {
  assertMinor(minor, true);
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const factor = minorFactor(digits);
  const whole = Math.floor(abs / factor);
  const fraction = abs % factor;
  const body = digits > 0 ? `${whole}.${String(fraction).padStart(digits, "0")}` : `${whole}`;
  return negative ? `-${body}` : body;
}

export function sumMinor(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Splits `total` minor units into `parts` integer shares.
 * Returns the base share and how many leftover units must still be allocated.
 */
export function splitEvenly(total: number, parts: number): { base: number; remainder: number } {
  assertMinor(total);
  if (!Number.isInteger(parts) || parts <= 0) throw new Error("parts must be a positive integer");
  const base = Math.floor(total / parts);
  return { base, remainder: total - base * parts };
}

export function assertMinor(value: number, allowNegative = false): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`Monetary values must be safe integers in minor units, received ${value}`);
  }
  if (!allowNegative && value < 0) {
    throw new Error(`Monetary value cannot be negative, received ${value}`);
  }
}
