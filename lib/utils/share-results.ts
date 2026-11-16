import type { ExpenseCalculationResult } from "@/types/settlement";
import type { Destination } from "@/types/trip";
import { getDictionary, type Language } from "@/lib/i18n";
import { formatMoney } from "./format-currency";
import { joinNames } from "./funny-messages";

export function describeFairShare(result: ExpenseCalculationResult): string {
  const code = result.currency.code;
  if (!result.hasUnevenSplit) return formatMoney(result.fairShareBase, code);
  return `${formatMoney(result.fairShareBase, code)}–${formatMoney(result.fairShareBase + 1, code)}`;
}

/** Just the "who pays whom" lines. */
export function buildSettlementText(result: ExpenseCalculationResult, language: Language = "en"): string {
  const t = getDictionary(language).shareText;
  const code = result.currency.code;
  if (result.isAllZero) return t.nothing;
  if (result.isEveryoneSettled) return t.settled;
  return result.transactions.map((tx) => `${tx.fromName} → ${tx.toName}: ${formatMoney(tx.amount, code)}`).join("\n");
}

/** Full shareable summary of the trip, in the chosen language. */
export function buildShareText(
  result: ExpenseCalculationResult,
  destination: Destination | null,
  language: Language = "en",
): string {
  const t = getDictionary(language).shareText;
  const code = result.currency.code;
  const fairShare = result.hasUnevenSplit ? `${describeFairShare(result)} ${t.roundedNote}` : describeFairShare(result);

  const lines: string[] = [
    `${t.title(t.trip(destination?.name ?? null))} ${destination?.emoji ?? ""}`.trim(),
    "",
    `${t.totalSpent}: ${formatMoney(result.totalExpenditure, code)}`,
    `${t.people}: ${result.participantCount}`,
    `${t.fairShare}: ${fairShare}`,
    "",
    t.whoPaid,
    ...result.participants.map((p) => `${p.name}: ${formatMoney(p.paid, code)}`),
    "",
    t.settlement,
    buildSettlementText(result, language),
  ];

  if (!result.isAllZero && !result.allSpentEqually) {
    lines.push(
      "",
      `${t.biggest}: ${joinNames(result.biggestSpenders.map((p) => p.name))}`,
      `${t.lowest}: ${joinNames(result.lowestSpenders.map((p) => p.name))}`,
    );
  }
  lines.push("", t.closing);
  return lines.join("\n");
}

/** Copies text, falling back to a hidden textarea for older/insecure contexts. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy approach
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

/** Uses the Web Share API when available, otherwise copies to the clipboard. */
export async function shareResults(text: string, title: string): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // Some browsers expose share() but refuse it — fall back to copying.
    }
  }
  return (await copyToClipboard(text)) ? "copied" : "failed";
}
