import type { TripSession, TripStep } from "@/types/trip";
import type { ExpenseCalculationInput, ExpenseCalculationResult } from "@/types/settlement";
import { getCurrency, sumMinor } from "@/lib/calculations/money-utils";
import { calculateTripSettlement } from "@/lib/calculations/expense-calculator";
import { MIN_PARTICIPANTS, validateAmountInput } from "@/lib/utils/validation";

type SessionData = Pick<TripSession, "destination" | "participants" | "expenses" | "currency" | "revealed">;

export function hasDestination(s: SessionData): boolean {
  return s.destination !== null;
}

export function hasEnoughParticipants(s: SessionData): boolean {
  return s.participants.length >= MIN_PARTICIPANTS;
}

/** Per-participant amount validation, keyed by participant id. */
export function getAmountErrors(s: SessionData): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const p of s.participants) {
    const result = validateAmountInput(s.expenses[p.id], s.currency);
    if (!result.success) errors[p.id] = result.error;
  }
  return errors;
}

export function areExpensesValid(s: SessionData): boolean {
  return hasEnoughParticipants(s) && Object.keys(getAmountErrors(s)).length === 0;
}

/** Highest step the user may currently visit — prevents skipping past invalid data. */
export function getMaxAccessibleStep(s: SessionData): TripStep {
  if (!hasDestination(s)) return 1;
  if (!areExpensesValid(s) || !s.revealed) return 2;
  return 3;
}

/** Builds the engine input from the session; null while any amount is invalid. */
export function buildCalculationInput(s: SessionData): ExpenseCalculationInput | null {
  if (!areExpensesValid(s)) return null;
  const participants = s.participants.map((p) => {
    const result = validateAmountInput(s.expenses[p.id], s.currency);
    return { id: p.id, name: p.name, paid: result.success ? result.minor : 0 };
  });
  return { participants, currency: getCurrency(s.currency) };
}

export function computeResult(s: SessionData): ExpenseCalculationResult | null {
  const input = buildCalculationInput(s);
  return input ? calculateTripSettlement(input) : null;
}

export interface LiveExpenseSummary {
  total: number;
  participantCount: number;
  /** Rounded average for display; `isExact` is false if it isn't a whole number of minor units. */
  average: number;
  isExact: boolean;
  /** Valid amounts by participant id (invalid/empty fields are treated as 0 for the live total). */
  amounts: Record<string, number>;
}

/** Running totals while amounts are being typed — tolerant of half-typed fields. */
export function computeLiveSummary(s: SessionData): LiveExpenseSummary {
  const amounts: Record<string, number> = {};
  for (const p of s.participants) {
    const result = validateAmountInput(s.expenses[p.id], s.currency);
    amounts[p.id] = result.success ? result.minor : 0;
  }
  const total = sumMinor(Object.values(amounts));
  const count = s.participants.length;
  return {
    total,
    participantCount: count,
    average: count ? Math.round(total / count) : 0,
    isExact: count ? total % count === 0 : true,
    amounts,
  };
}
