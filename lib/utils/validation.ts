import { z } from "zod";
import type { Participant } from "@/types/participant";
import type { CurrencyCode } from "@/types/trip";
import { MAX_AMOUNT_MAJOR, getCurrency, minorFactor, parseMajorToMinor } from "@/lib/calculations/money-utils";
import { getDictionary, type Language } from "@/lib/i18n";
import { formatMoney } from "./format-currency";

export const MIN_PARTICIPANTS = 2;
export const MAX_PARTICIPANTS = 30;
export const MAX_NAME_LENGTH = 24;
export const MAX_DESTINATION_LENGTH = 40;

/** A value, or a function returning the live value (lets static schemas read current state). */
type Getter<T> = T | (() => T);
const resolve = <T,>(value: Getter<T>): T => (typeof value === "function" ? (value as () => T)() : value);

/* -------------------------------------------------------------------------- */
/*                                   Names                                    */
/* -------------------------------------------------------------------------- */

/** Removes control characters and angle brackets, collapses whitespace, trims. */
export function sanitizeText(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Key used for duplicate detection: case-insensitive, whitespace-insensitive at the edges. */
export function nameKey(raw: string): string {
  return sanitizeText(raw).toLocaleLowerCase();
}

function participantNameSchema(language: Language) {
  const e = getDictionary(language).errors;
  return z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(1, e.nameEmpty)
        .max(MAX_NAME_LENGTH, e.nameTooLong(MAX_NAME_LENGTH))
        .regex(/[\p{L}\p{N}]/u, e.nameNeedsLetter),
    );
}

export type NameValidationResult = { success: true; name: string } | { success: false; error: string };

/**
 * Validates a participant name against the current squad.
 * `excludeId` lets a participant keep their own name while editing.
 */
export function validateParticipantName(
  raw: string,
  existing: readonly Participant[],
  excludeId?: string,
  language: Language = "en",
): NameValidationResult {
  const e = getDictionary(language).errors;
  const parsed = participantNameSchema(language).safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? e.nameEmpty };
  }
  const name = parsed.data;
  const key = nameKey(name);
  const clash = existing.find((p) => p.id !== excludeId && nameKey(p.name) === key);
  if (clash) return { success: false, error: e.nameDuplicate(clash.name) };
  if (!excludeId && existing.length >= MAX_PARTICIPANTS) {
    return { success: false, error: e.squadFull(MAX_PARTICIPANTS) };
  }
  return { success: true, name };
}

/**
 * Zod schema for the add/edit participant forms (React Hook Form).
 * `existing` and `language` may be getters so the schema always checks live state.
 */
export function createParticipantFormSchema(
  existing: Getter<readonly Participant[]>,
  excludeId?: string,
  language: Getter<Language> = "en",
) {
  return z.object({
    name: z.string().superRefine((value, ctx) => {
      const result = validateParticipantName(value, resolve(existing), excludeId, resolve(language));
      if (!result.success) ctx.addIssue({ code: "custom", message: result.error });
    }),
  });
}

export function createDestinationFormSchema(language: Getter<Language> = "en") {
  return z.object({
    name: z
      .string()
      .transform(sanitizeText)
      .superRefine((value, ctx) => {
        const e = getDictionary(resolve(language)).errors;
        let message: string | null = null;
        if (value.length < 2) message = e.destinationTooShort;
        else if (value.length > MAX_DESTINATION_LENGTH) message = e.destinationTooLong(MAX_DESTINATION_LENGTH);
        else if (!/[\p{L}]/u.test(value)) message = e.destinationNeedsLetter;
        if (message) ctx.addIssue({ code: "custom", message });
      }),
  });
}

/* -------------------------------------------------------------------------- */
/*                                  Amounts                                   */
/* -------------------------------------------------------------------------- */

/**
 * Cleans what the user types into an amount field so invalid characters never
 * make it in: drops everything except digits and one decimal point, removes
 * thousands separators and limits decimals to the currency's precision.
 */
export function sanitizeAmountInput(raw: string, minorUnitDigits: number): string {
  let cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    const whole = cleaned.slice(0, firstDot);
    const fraction = cleaned.slice(firstDot + 1).replace(/\./g, "");
    cleaned = minorUnitDigits === 0 ? whole : `${whole}.${fraction.slice(0, minorUnitDigits)}`;
  }
  // Strip leading zeros ("007" → "7") but keep "0" and "0.5".
  cleaned = cleaned.replace(/^0+(?=\d)/, "");
  if (cleaned.startsWith(".")) cleaned = `0${cleaned}`;
  return cleaned.slice(0, 16);
}

export type AmountValidationResult = { success: true; minor: number } | { success: false; error: string };

/** Validates an amount string for a currency and converts it to integer minor units. */
export function validateAmountInput(
  raw: string | undefined,
  code: CurrencyCode,
  language: Language = "en",
): AmountValidationResult {
  const e = getDictionary(language).errors;
  const currency = getCurrency(code);
  const value = (raw ?? "").trim();

  if (value === "") return { success: false, error: e.amountEmpty };
  if (value.startsWith("-")) return { success: false, error: e.amountNegative };

  const minor = parseMajorToMinor(value, currency.minorUnitDigits);
  if (minor === null) {
    const decimals = value.split(".")[1];
    if (/^\d+\.\d+$/.test(value) && decimals && decimals.length > currency.minorUnitDigits) {
      return {
        success: false,
        error: currency.minorUnitDigits === 0 ? e.amountNoDecimals(currency.code) : e.amountTooManyDecimals(currency.minorUnitDigits),
      };
    }
    return { success: false, error: e.amountFormat };
  }

  const max = MAX_AMOUNT_MAJOR * minorFactor(currency.minorUnitDigits);
  if (minor > max) return { success: false, error: e.amountTooLarge(formatMoney(max, code)) };
  return { success: true, minor };
}

/** Zod schema for a single amount field (used by the expense form resolver). */
export function createAmountSchema(code: Getter<CurrencyCode>, language: Getter<Language> = "en") {
  return z.string().superRefine((value, ctx) => {
    const result = validateAmountInput(value, resolve(code), resolve(language));
    if (!result.success) ctx.addIssue({ code: "custom", message: result.error });
  });
}

export function createExpenseFormSchema(code: Getter<CurrencyCode>, language: Getter<Language> = "en") {
  return z.object({
    amounts: z.array(z.object({ participantId: z.string().min(1), value: createAmountSchema(code, language) })),
  });
}
