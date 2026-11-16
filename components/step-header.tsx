"use client";

import type { ReactNode } from "react";
import { Check, HandCoins, MapPin, Users, type LucideIcon } from "lucide-react";
import { useTripStore } from "@/lib/store/trip-store";
import { getMaxAccessibleStep } from "@/lib/store/trip-selectors";
import { useT } from "@/lib/store/preferences-store";
import { cn } from "@/lib/utils/cn";
import type { TripStep } from "@/types/trip";

const TOTAL = 3;
const ICONS: LucideIcon[] = [MapPin, Users, HandCoins];

/** Three-step tracker + page title. Steps you've already reached are clickable. */
export function StepHeader({ step, title, description }: { step: 1 | 2 | 3; title: ReactNode; description?: ReactNode }) {
  const t = useT();
  const maxAccessible = useTripStore((s) => getMaxAccessibleStep(s));
  const goToStep = useTripStore((s) => s.goToStep);

  return (
    <header className="mb-7">
      <nav aria-label={t.common.stepOf(step, TOTAL)} className="mb-7">
        <ol className="flex items-center">
          {t.common.steps.map((label, i) => {
            const n = (i + 1) as TripStep;
            const Icon = ICONS[i];
            const current = n === step;
            const done = n < step;
            const reachable = n <= maxAccessible && !current;
            return (
              <li key={label} className={cn("flex items-center", i < TOTAL - 1 && "flex-1")}>
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => goToStep(n)}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "group flex items-center gap-2 rounded-full focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:outline-none",
                    reachable ? "cursor-pointer" : "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm",
                      current && "border-primary bg-primary text-primary-foreground",
                      done && "border-success bg-success-soft text-success",
                      !current && !done && "border-border-strong bg-card text-muted-foreground",
                      reachable && "group-hover:border-accent",
                    )}
                  >
                    {done ? <Check className="size-4" strokeWidth={2.5} /> : <Icon className="size-4" />}
                  </span>
                  <span
                    className={cn(
                      "text-sm whitespace-nowrap",
                      current ? "font-semibold text-foreground" : "hidden text-muted-foreground sm:inline",
                      reachable && "group-hover:text-foreground",
                    )}
                  >
                    {label}
                  </span>
                </button>
                {i < TOTAL - 1 && (
                  <span aria-hidden className={cn("mx-2 h-px flex-1 sm:mx-3", n < step ? "bg-success/60" : "bg-border-strong")} />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <p className="mb-1.5 flex items-center gap-2 font-mono text-xs tracking-[0.18em] text-foreground uppercase">
        <span aria-hidden className="h-px w-5 bg-accent" />
        {t.common.stepOf(step, TOTAL)}
      </p>
      <h1 className="font-serif text-[40px] leading-[1.05] text-foreground sm:text-5xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">{description}</p>}
    </header>
  );
}
