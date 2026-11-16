import type { CurrencyInfo } from "./trip";

/*
 * IMPORTANT: every monetary value in these interfaces is an INTEGER amount of
 * minor currency units (paise, cents, ...). Never floats.
 */

export interface ParticipantExpenseInput {
  id: string;
  name: string;
  /** Total the participant paid towards shared expenses, in minor units. */
  paid: number;
}

export interface ExpenseCalculationInput {
  participants: ParticipantExpenseInput[];
  currency: CurrencyInfo;
}

export type BalanceStatus = "receives" | "pays" | "settled";

export interface ParticipantBreakdown {
  id: string;
  name: string;
  /** Position in the original input (used for deterministic tie-breaking). */
  order: number;
  paid: number;
  /** This participant's share of the total. Shares always add up to the total. */
  fairShare: number;
  /** paid - fairShare. Positive → receives money, negative → pays money. */
  balance: number;
  status: BalanceStatus;
  /** Share of the total trip spend this person covered (0–100, display only). */
  contributionPercent: number;
  /** True if this person absorbed one leftover minor unit from an uneven split. */
  absorbedRemainderUnit: boolean;
}

export interface SettlementTransaction {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export interface NetBalance {
  id: string;
  name: string;
  order: number;
  balance: number;
}

export interface ExpenseCalculationResult {
  currency: CurrencyInfo;
  totalExpenditure: number;
  participantCount: number;
  /** floor(total / participants) — the share before leftover units are allocated. */
  fairShareBase: number;
  /** Leftover minor units distributed one-by-one (0 when the split is even). */
  fairShareRemainder: number;
  hasUnevenSplit: boolean;
  participants: ParticipantBreakdown[];
  totalToReceive: number;
  totalToPay: number;
  transactions: SettlementTransaction[];
  biggestSpenders: ParticipantBreakdown[];
  lowestSpenders: ParticipantBreakdown[];
  settledParticipants: ParticipantBreakdown[];
  /** Everyone paid exactly the same amount (awards make no sense). */
  allSpentEqually: boolean;
  /** No shared expenses were recorded at all. */
  isAllZero: boolean;
  /** No transfers are needed. */
  isEveryoneSettled: boolean;
}
