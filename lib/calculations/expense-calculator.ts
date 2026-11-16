import type {
  ExpenseCalculationInput,
  ExpenseCalculationResult,
  ParticipantBreakdown,
  BalanceStatus,
} from "@/types/settlement";
import { assertMinor, splitEvenly, sumMinor } from "./money-utils";
import { applyTransactions, settleBalances } from "./settlement-engine";

/**
 * Allocates fair shares so that they add up to the total EXACTLY.
 *
 * Example: ₹100.00 (10000 paise) between 3 people → base 3333 paise, 1 paisa
 * left over. Leftover units are handed out one at a time, deterministically,
 * to the people who PAID THE MOST (ties → earlier in the list). Giving the
 * extra unit to the biggest payers slightly reduces what they get back instead
 * of inventing tiny 1-paisa debts for people who were otherwise even.
 */
function allocateFairShares(paid: readonly number[], total: number): { shares: number[]; base: number; remainder: number } {
  const count = paid.length;
  const { base, remainder } = splitEvenly(total, count);
  const shares = new Array<number>(count).fill(base);

  const priority = paid
    .map((amount, index) => ({ amount, index }))
    .sort((a, b) => b.amount - a.amount || a.index - b.index);

  for (let i = 0; i < remainder; i++) {
    shares[priority[i].index] += 1;
  }
  return { shares, base, remainder };
}

function statusFor(balance: number): BalanceStatus {
  if (balance > 0) return "receives";
  if (balance < 0) return "pays";
  return "settled";
}

/**
 * Core BillDrama calculation. Pure, deterministic and UI-independent.
 *
 *   total        = Σ paid
 *   fairShare_i  = total / n   (integer minor units, leftovers allocated as above)
 *   balance_i    = paid_i − fairShare_i
 *   transactions = settleBalances(balances)
 */
export function calculateTripSettlement(input: ExpenseCalculationInput): ExpenseCalculationResult {
  const { participants, currency } = input;

  if (participants.length === 0) {
    throw new Error("At least one participant is required");
  }
  const ids = new Set<string>();
  for (const participant of participants) {
    assertMinor(participant.paid);
    if (ids.has(participant.id)) throw new Error(`Duplicate participant id: ${participant.id}`);
    ids.add(participant.id);
  }

  const paidAmounts = participants.map((p) => p.paid);
  const totalExpenditure = sumMinor(paidAmounts);
  const { shares, base, remainder } = allocateFairShares(paidAmounts, totalExpenditure);

  const breakdown: ParticipantBreakdown[] = participants.map((participant, order) => {
    const fairShare = shares[order];
    const balance = participant.paid - fairShare;
    return {
      id: participant.id,
      name: participant.name,
      order,
      paid: participant.paid,
      fairShare,
      balance,
      status: statusFor(balance),
      contributionPercent: totalExpenditure === 0 ? 0 : (participant.paid / totalExpenditure) * 100,
      absorbedRemainderUnit: fairShare > base,
    };
  });

  const netBalances = breakdown.map(({ id, name, order, balance }) => ({ id, name, order, balance }));
  const transactions = settleBalances(netBalances);

  // Sanity check: after the suggested transfers everyone must be exactly at zero.
  for (const [id, remaining] of applyTransactions(netBalances, transactions)) {
    if (remaining !== 0) throw new Error(`Settlement failed to zero out participant ${id}`);
  }

  const totalToReceive = sumMinor(breakdown.filter((p) => p.balance > 0).map((p) => p.balance));
  const totalToPay = sumMinor(breakdown.filter((p) => p.balance < 0).map((p) => -p.balance));

  const maxPaid = Math.max(...paidAmounts);
  const minPaid = Math.min(...paidAmounts);

  return {
    currency,
    totalExpenditure,
    participantCount: participants.length,
    fairShareBase: base,
    fairShareRemainder: remainder,
    hasUnevenSplit: remainder !== 0,
    participants: breakdown,
    totalToReceive,
    totalToPay,
    transactions,
    biggestSpenders: breakdown.filter((p) => p.paid === maxPaid),
    lowestSpenders: breakdown.filter((p) => p.paid === minPaid),
    settledParticipants: breakdown.filter((p) => p.status === "settled"),
    allSpentEqually: maxPaid === minPaid,
    isAllZero: totalExpenditure === 0,
    isEveryoneSettled: transactions.length === 0,
  };
}
