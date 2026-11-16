"use client";

import { ArrowDownLeft, ArrowUpRight, Minus } from "lucide-react";
import type { ExpenseCalculationResult } from "@/types/settlement";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { formatMoney } from "@/lib/utils/format-currency";
import { useT } from "@/lib/store/preferences-store";
import { cn } from "@/lib/utils/cn";

/**
 * "How we worked it out": what each person paid vs. their share, with a thin bar
 * (paid) and a tick (share). The result is always spelled out in words; colour
 * only reinforces it.
 */
export function ExpenseBreakdown({ result, colorOf }: { result: ExpenseCalculationResult; colorOf: (id: string) => number }) {
  const t = useT();
  const b = t.breakdown;
  const code = result.currency.code;
  const share = result.hasUnevenSplit ? `≈ ${formatMoney(result.fairShareBase, code)}` : formatMoney(result.fairShareBase, code);
  const scaleMax = Math.max(1, ...result.participants.map((p) => Math.max(p.paid, p.fairShare)));

  return (
    <div>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        {t.results.breakdownIntro(formatMoney(result.totalExpenditure, code), result.participantCount, share)}
      </p>
      <ul className="mt-4 divide-y divide-dashed divide-border-strong">
        {result.participants.map((p) => (
          <li key={p.id} className="py-3">
            <div className="flex items-center gap-3">
              <ParticipantAvatar name={p.name} colorIndex={colorOf(p.id)} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">{p.name}</span>
              <span className="font-mono text-sm text-muted-foreground tabular-nums">
                {formatMoney(p.paid, code)}
                <span className="hidden sm:inline"> / {formatMoney(p.fairShare, code)}{p.absorbedRemainderUnit && "*"}</span>
              </span>
              <span
                className={cn(
                  "inline-flex min-w-28 items-center justify-end gap-1 text-sm font-medium",
                  p.status === "receives" ? "text-success" : "text-foreground",
                )}
              >
                {p.status === "receives" && <ArrowDownLeft className="size-4" aria-hidden />}
                {p.status === "pays" && <ArrowUpRight className="size-4 text-accent-2" aria-hidden />}
                {p.status === "settled" && <Minus className="size-4 text-muted-foreground" aria-hidden />}
                {p.status === "receives" && b.getsBack(formatMoney(p.balance, code))}
                {p.status === "pays" && b.pays(formatMoney(-p.balance, code))}
                {p.status === "settled" && b.square}
              </span>
            </div>
            <div className="relative mt-2 ml-10 h-1.5 rounded-full bg-elevated" aria-hidden>
              <div
                className={cn("h-full rounded-full", p.status === "receives" ? "bg-success" : p.status === "pays" ? "bg-accent-2" : "bg-muted-foreground")}
                style={{ width: `${(p.paid / scaleMax) * 100}%` }}
              />
              <span className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-foreground" style={{ left: `calc(${(p.fairShare / scaleMax) * 100}% - 1px)` }} />
            </div>
          </li>
        ))}
      </ul>
      {result.hasUnevenSplit && <p className="mt-3 text-xs text-muted-foreground">{b.remainderNote}</p>}
    </div>
  );
}
