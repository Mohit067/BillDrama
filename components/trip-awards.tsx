"use client";

import { PiggyBank, Trophy, type LucideIcon } from "lucide-react";
import type { ExpenseCalculationResult, ParticipantBreakdown } from "@/types/settlement";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { formatMoney } from "@/lib/utils/format-currency";
import { getBudgetAward, getMvpAward, joinNames } from "@/lib/utils/funny-messages";
import { useLanguage, useT } from "@/lib/store/preferences-store";

function AwardCard({
  icon: Icon,
  label,
  title,
  people,
  line,
  amount,
  colorOf,
}: {
  icon: LucideIcon;
  label: string;
  title: string;
  people: ParticipantBreakdown[];
  line: string;
  amount: string;
  colorOf: (id: string) => number;
}) {
  return (
    <article className="surface relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex -space-x-2">
          {people.slice(0, 4).map((p) => (
            <ParticipantAvatar key={p.id} name={p.name} colorIndex={colorOf(p.id)} size="lg" className="ring-2 ring-card" />
          ))}
        </div>
        <div className="min-w-0">
          <p className="font-serif text-2xl leading-tight break-words text-foreground">{joinNames(people.map((p) => p.name))}</p>
          <p className="font-mono text-sm text-muted-foreground">{amount}</p>
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold tracking-wide text-foreground uppercase">{title}</p>
      <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{line}</p>
    </article>
  );
}

/** The fun bit — kept below the answer so it never gets in the way. */
export function TripAwards({ result, seed, colorOf }: { result: ExpenseCalculationResult; seed: number; colorOf: (id: string) => number }) {
  const t = useT();
  const language = useLanguage();
  const code = result.currency.code;

  if (result.isAllZero) return null;
  if (result.allSpentEqually) return <p className="text-[15px] text-muted-foreground">{t.results.balancedText}</p>;

  const top = result.biggestSpenders;
  const low = result.lowestSpenders;
  const mvp = getMvpAward(top.map((p) => p.name), formatMoney(top[0].paid, code), seed, language);
  const budget = getBudgetAward(low.map((p) => p.name), seed, language);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <AwardCard
        icon={Trophy}
        label={t.results.mvpLabel}
        title={mvp.title}
        people={top}
        line={mvp.quip}
        amount={t.awards.spent(formatMoney(top[0].paid, code))}
        colorOf={colorOf}
      />
      <AwardCard
        icon={PiggyBank}
        label={t.results.budgetLabel}
        title={budget.title}
        people={low}
        line={budget.line}
        amount={t.awards.spent(formatMoney(low[0].paid, code))}
        colorOf={colorOf}
      />
    </div>
  );
}
