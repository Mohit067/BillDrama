"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Scale, Users, Wallet, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StepHeader } from "@/components/step-header";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { Receipt, ReceiptRule, Stamp } from "@/components/receipt";
import { ExpenseBreakdown } from "@/components/expense-breakdown";
import { TripAwards } from "@/components/trip-awards";
import { ShareActions } from "@/components/share-actions";
import { useTripStore } from "@/lib/store/trip-store";
import { useLanguage, useT } from "@/lib/store/preferences-store";
import { useColorOf, useTripResult } from "@/hooks/use-trip";
import { formatMoney } from "@/lib/utils/format-currency";
import { getClosingMessage } from "@/lib/utils/funny-messages";
import { describeFairShare } from "@/lib/utils/share-results";

/** A small burst of confetti, in the palette's own amber, terracotta and greens. */
async function fireConfetti() {
  const confetti = (await import("canvas-confetti")).default;
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 38,
    origin: { y: 0.3 },
    colors: ["#dda15e", "#e07a5f", "#86c99d", "#273d36", "#e9e3d5"],
    shapes: ["square"],
    scalar: 0.9,
    disableForReducedMotion: true,
    zIndex: 70,
  });
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 font-serif text-[30px] leading-tight text-foreground">{children}</h2>;
}

function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="surface flex flex-col items-start gap-2 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent sm:size-10">
        <Icon className="size-4 sm:size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs leading-tight text-muted-foreground">{label}</p>
        <p className="font-mono text-[15px] font-semibold break-words text-foreground tabular-nums sm:text-lg">{value}</p>
      </div>
    </div>
  );
}

/** Step 3 — the answer first, everything else after. */
export function ResultsScreen({ celebrate, onCelebrated }: { celebrate: boolean; onCelebrated: () => void }) {
  const t = useT();
  const language = useLanguage();
  const state = useTripStore();
  const { destination, seed } = state;
  const [confirmNew, setConfirmNew] = useState(false);

  // Every number here comes from the engine, fed with what the user typed.
  const result = useTripResult();
  const colorOf = useColorOf();

  useEffect(() => {
    if (celebrate && result) {
      void fireConfetti();
      onCelebrated();
    }
  }, [celebrate, result, onCelebrated]);

  if (!result) {
    return (
      <div className="surface mx-auto max-w-md p-6 text-center">
        <p className="font-serif text-2xl text-foreground">{t.results.errorTitle}</p>
        <p className="mt-1 text-muted-foreground">{t.results.errorText}</p>
        <Button className="mt-4" onClick={() => state.goToStep(2)}>
          {t.results.errorAction}
        </Button>
      </div>
    );
  }

  const code = result.currency.code;
  const txCount = result.transactions.length;
  const shareValue = `${result.hasUnevenSplit ? "≈ " : ""}${formatMoney(result.fairShareBase, code)}`;

  return (
    <section>
      <StepHeader
        step={3}
        title={t.results.title}
        description={destination ? `${destination.emoji} ${destination.name}` : undefined}
      />

      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        <StatTile icon={Wallet} label={t.results.statTotal} value={formatMoney(result.totalExpenditure, code)} />
        <StatTile icon={Users} label={t.results.statPeople} value={String(result.participantCount)} />
        <StatTile icon={Scale} label={t.results.statShare} value={shareValue} />
      </div>

      {/* The answer, as a receipt */}
      <Receipt>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p className="font-mono text-xs tracking-[0.2em] whitespace-nowrap text-muted-foreground uppercase">{t.results.answerLabel}</p>
          {txCount > 0 && <p className="text-sm text-muted-foreground">{t.results.paymentsCount(txCount)}</p>}
        </div>
        <ReceiptRule />

        {txCount === 0 ? (
          <div className="py-6 text-center">
            <Stamp animate className="text-base">
              {t.results.settledStamp}
            </Stamp>
            <p className="mt-5 font-serif text-2xl text-foreground">{result.isAllZero ? t.results.nothingTitle : t.results.allSettledTitle}</p>
            <p className="mt-1 text-[15px] text-muted-foreground">{result.isAllZero ? t.results.nothingText : t.results.allSettledText}</p>
          </div>
        ) : (
          <ol className="space-y-3">
            {result.transactions.map((tx, i) => {
              const amount = formatMoney(tx.amount, code);
              return (
                <motion.li
                  key={`${tx.fromId}-${tx.toId}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-lg bg-elevated/60 p-3 sm:p-4"
                >
                  <p className="sr-only">{t.results.sentence(tx.fromName, tx.toName, amount)}</p>
                  <div aria-hidden className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                    <ParticipantAvatar name={tx.fromName} colorIndex={colorOf(tx.fromId)} />
                    <div className="min-w-0 text-[16px] leading-snug text-foreground">
                      <strong className="font-semibold">{tx.fromName}</strong>
                      <span className="text-muted-foreground">{t.results.joinFromTo}</span>
                      <strong className="font-semibold">{tx.toName}</strong>
                      <span className="text-muted-foreground">{t.results.joinToAmount}</span>
                    </div>
                    <ArrowRight className="hidden size-4 shrink-0 text-accent sm:block" />
                    <ParticipantAvatar name={tx.toName} colorIndex={colorOf(tx.toId)} className="hidden sm:inline-flex" />
                  </div>
                  <span aria-hidden className="shrink-0 font-mono text-lg font-semibold text-foreground tabular-nums sm:text-xl">
                    {amount}
                  </span>
                </motion.li>
              );
            })}
          </ol>
        )}
      </Receipt>

      {result.hasUnevenSplit && <p className="mt-3 text-sm text-muted-foreground">{t.results.unevenNote(describeFairShare(result))}</p>}

      {/* Share */}
      <div className="mt-10">
        <SectionHeading>{t.results.shareHeading}</SectionHeading>
        <ShareActions result={result} destination={destination} />
      </div>

      {/* How it was worked out — folded away so it doesn't overwhelm */}
      <details className="group surface mt-8 p-0">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-5 py-4 font-semibold text-foreground focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          {t.results.breakdownSummary}
          <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-border px-5 pt-4 pb-5">
          <ExpenseBreakdown result={result} colorOf={colorOf} />
        </div>
      </details>

      {/* Awards */}
      {!result.isAllZero && (
        <div className="mt-10">
          <SectionHeading>{t.results.awardsHeading}</SectionHeading>
          <TripAwards result={result} seed={seed} colorOf={colorOf} />
        </div>
      )}

      {/* Sign-off */}
      <div className="surface mt-12 overflow-hidden p-8 text-center">
        <p className="mx-auto max-w-md font-serif text-[28px] leading-snug text-foreground italic">{getClosingMessage(seed, language)}</p>
        <p className="mt-2 text-muted-foreground">{t.results.closingSub}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="outline" size="lg" onClick={() => state.goToStep(2)}>
            {t.results.editAmounts}
          </Button>
          <Button size="lg" onClick={() => setConfirmNew(true)}>
            {t.results.planNext} <ArrowRight />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmNew}
        onOpenChange={setConfirmNew}
        title={t.results.newTitle}
        description={t.results.newDescription}
        confirmLabel={t.results.newConfirm}
        cancelLabel={t.results.newCancel}
        onConfirm={() => {
          state.resetTrip();
          useTripStore.getState().startTrip();
          toast(t.results.newToast);
        }}
      />
    </section>
  );
}
