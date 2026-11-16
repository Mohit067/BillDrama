import type { NetBalance, SettlementTransaction } from "@/types/settlement";
import { assertMinor } from "./money-utils";

interface MutableBalance {
  id: string;
  name: string;
  order: number;
  /** Remaining absolute amount (always positive while still open). */
  remaining: number;
}

/** Larger amount first; ties broken by original input order, so results are deterministic. */
function byLargestThenOrder(a: MutableBalance, b: MutableBalance): number {
  return b.remaining - a.remaining || a.order - b.order;
}

/**
 * Turns net balances into a list of payments.
 *
 * Strategy — deterministic "largest debtor pays largest creditor":
 *   1. Split participants into debtors (balance < 0) and creditors (balance > 0).
 *      People with a zero balance are already settled and never appear.
 *   2. Repeatedly take the debtor who owes the most and the creditor who is owed
 *      the most, and transfer min(owed, due) between them.
 *   3. Each transfer fully closes at least one of the two, so the loop ends after
 *      at most (n − 1) transfers and money only ever flows debtor → creditor
 *      (no circular transfers).
 *
 * This keeps the transfer count small and is easy to reason about, but it does
 * NOT promise the mathematically minimum number of transactions (that problem
 * is NP-hard in general).
 *
 * All amounts are integer minor units. Balances must sum to exactly zero.
 */
export function settleBalances(balances: readonly NetBalance[]): SettlementTransaction[] {
  let net = 0;
  for (const entry of balances) {
    assertMinor(entry.balance, true);
    net += entry.balance;
  }
  if (net !== 0) {
    throw new Error(`Balances must sum to zero to be settled (off by ${net} minor units)`);
  }

  const debtors: MutableBalance[] = [];
  const creditors: MutableBalance[] = [];
  for (const { id, name, order, balance } of balances) {
    if (balance < 0) debtors.push({ id, name, order, remaining: -balance });
    else if (balance > 0) creditors.push({ id, name, order, remaining: balance });
  }

  const transactions: SettlementTransaction[] = [];
  const maxIterations = balances.length * balances.length + 1; // safety net — never reached in practice

  for (let guard = 0; debtors.length > 0 && creditors.length > 0; guard++) {
    if (guard > maxIterations) throw new Error("Settlement did not converge");

    debtors.sort(byLargestThenOrder);
    creditors.sort(byLargestThenOrder);

    const debtor = debtors[0];
    const creditor = creditors[0];
    const amount = Math.min(debtor.remaining, creditor.remaining);

    transactions.push({
      fromId: debtor.id,
      fromName: debtor.name,
      toId: creditor.id,
      toName: creditor.name,
      amount,
    });

    debtor.remaining -= amount;
    creditor.remaining -= amount;
    if (debtor.remaining === 0) debtors.shift();
    if (creditor.remaining === 0) creditors.shift();
  }

  // Because balances sum to zero, both lists must empty out together.
  if (debtors.length > 0 || creditors.length > 0) {
    throw new Error("Settlement left unmatched balances");
  }

  return transactions;
}

/**
 * Applies transactions to balances and returns what remains for each id.
 * After a correct settlement every value is 0. Useful for tests and sanity checks.
 */
export function applyTransactions(
  balances: readonly NetBalance[],
  transactions: readonly SettlementTransaction[],
): Map<string, number> {
  const remaining = new Map(balances.map((entry) => [entry.id, entry.balance]));
  for (const tx of transactions) {
    // A debtor's negative balance moves up when they pay; a creditor's moves down when paid.
    remaining.set(tx.fromId, (remaining.get(tx.fromId) ?? 0) + tx.amount);
    remaining.set(tx.toId, (remaining.get(tx.toId) ?? 0) - tx.amount);
  }
  return remaining;
}
