import type { Participant } from "./participant";

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "JPY";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  label: string;
  /** Locale used by Intl.NumberFormat for this currency. */
  locale: string;
  /** Number of minor-unit digits (2 for paise/cents, 0 for yen). */
  minorUnitDigits: number;
  flag: string;
}

export interface Destination {
  /** Preset id (e.g. "goa") or "custom". */
  id: string;
  name: string;
  emoji: string;
  isCustom: boolean;
}

/**
 * Journey steps — kept deliberately short for non-technical users.
 * 0 = welcome, 1 = where did you go, 2 = who paid what, 3 = who pays whom.
 */
export type TripStep = 0 | 1 | 2 | 3;

export const TRIP_STEPS = [0, 1, 2, 3] as const satisfies readonly TripStep[];

/** Everything that is persisted to LocalStorage for an unfinished trip. */
export interface TripSession {
  version: 2;
  sessionId: string;
  /**
   * Seed used ONLY for picking fun copy (CTA label, jokes) — never for money.
   * The CTA label is derived from it, so it stays fixed for the whole session
   * in whichever language is selected.
   */
  seed: number;
  step: TripStep;
  destination: Destination | null;
  participants: Participant[];
  /** Raw text the user typed for each participant id (validated separately). */
  expenses: Record<string, string>;
  currency: CurrencyCode;
  revealed: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}
