"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, HandCoins, MapPin, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { LeaderRow, Receipt, ReceiptRule, Stamp } from "@/components/receipt";
import { sessionHasData, useTripStore } from "@/lib/store/trip-store";
import { getMaxAccessibleStep } from "@/lib/store/trip-selectors";
import { usePreferencesStore, useT } from "@/lib/store/preferences-store";

const HOW_ICONS: LucideIcon[] = [MapPin, Users, HandCoins];

/** Clearly-labelled illustrative rows for the "Example" receipt (not used for any calculation). */
const EXAMPLE_ROWS = [
  { from: "Sneha", fromColor: 4, to: "Rahul", toColor: 1, amount: "₹3,000" },
  { from: "Aman", fromColor: 2, to: "Mohit", toColor: 0, amount: "₹1,000" },
  { from: "Aman", fromColor: 2, to: "Rahul", toColor: 1, amount: "₹1,000" },
];

export function WelcomeScreen() {
  const t = useT();
  const language = usePreferencesStore((s) => s.language);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);
  const state = useTripStore();
  const [confirmFresh, setConfirmFresh] = useState(false);
  const hasData = sessionHasData(state);

  return (
    <div>
      {/* Hero */}
      <section className="relative -mx-4 overflow-hidden px-4 pt-4 pb-10 md:pt-10">
        <div aria-hidden className="topo pointer-events-none absolute inset-0 -z-10" />
        <div className="grid items-center gap-10 md:grid-cols-[1.3fr_1fr] md:gap-12">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-accent" />
              {t.welcome.eyebrow}
            </p>
            <h1 className="font-serif text-[46px] leading-[1.02] text-foreground sm:text-[60px]">
              {t.welcome.headline}
              <br />
              <em className="text-accent">{t.welcome.headlineSecond}</em>
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted-foreground">{t.welcome.sub}</p>

            {hasData ? (
              <div className="surface mt-7 max-w-md p-4">
                <p className="font-semibold text-foreground">
                  {state.destination?.emoji} {t.welcome.resumeTitle(state.destination?.name ?? null)}
                </p>
                <p className="text-sm text-muted-foreground">{t.welcome.resumeText(state.participants.length)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => state.goToStep(Math.max(1, getMaxAccessibleStep(state)) as 1 | 2 | 3)}>
                    {t.welcome.continueTrip} <ArrowRight />
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmFresh(true)}>
                    {t.welcome.startFresh}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Button size="lg" onClick={state.startTrip} className="w-full sm:w-auto">
                  {t.welcome.start} <ArrowRight />
                </Button>
                <Button variant="link" onClick={state.loadDemoTrip}>
                  {t.welcome.demo}
                </Button>
              </div>
            )}

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {t.welcome.trust.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-4 text-success" aria-hidden /> {item}
                </li>
              ))}
            </ul>
            <Button variant="link" className="mt-4 text-sm" onClick={() => setLanguage(language === "en" ? "hinglish" : "en")}>
              {t.welcome.languagePrompt}
            </Button>
          </div>

          {/* Example result — shows what you'll get */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Receipt className="mx-auto w-full max-w-sm rotate-[0.8deg]">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-elevated px-2 py-0.5 font-mono text-[11px] tracking-wider text-foreground uppercase">
                  {t.welcome.exampleLabel}
                </span>
                <span className="font-mono text-xs text-muted-foreground">🏖️ {t.welcome.exampleTrip}</span>
              </div>
              <ReceiptRule />
              <ul className="space-y-3.5">
                {EXAMPLE_ROWS.map((row, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className="flex shrink-0 -space-x-2">
                      <ParticipantAvatar name={row.from} colorIndex={row.fromColor} size="sm" className="ring-2 ring-card" />
                      <ParticipantAvatar name={row.to} colorIndex={row.toColor} size="sm" className="ring-2 ring-card" />
                    </span>
                    <LeaderRow
                      className="min-w-0 flex-1 text-[15px] text-foreground"
                      label={
                        <>
                          <strong className="font-semibold">{row.from}</strong>
                          <span className="text-muted-foreground"> → </span>
                          <strong className="font-semibold">{row.to}</strong>
                        </>
                      }
                      value={row.amount}
                      valueClassName="font-semibold"
                    />
                  </li>
                ))}
              </ul>
              <ReceiptRule />
              <LeaderRow
                label={<span className="font-mono text-sm text-muted-foreground uppercase">{t.welcome.dramaLabel}</span>}
                value="₹0.00"
                className="text-foreground"
              />
              <LeaderRow
                label={<span className="font-mono text-sm text-muted-foreground uppercase">{t.welcome.argumentsLabel}</span>}
                value="0"
                className="mt-1 text-foreground"
              />
              <div className="mt-4 flex justify-end">
                <Stamp className="text-sm">{t.welcome.stamp}</Stamp>
              </div>
            </Receipt>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border pt-10">
        <h2 className="font-serif text-3xl text-foreground">{t.welcome.howTitle}</h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {t.welcome.howSteps.map((step, i) => {
            const Icon = HOW_ICONS[i];
            return (
              <li key={step.title} className="surface p-5">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-4 text-[17px] font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-[15px] text-muted-foreground">{step.text}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <ConfirmDialog
        open={confirmFresh}
        onOpenChange={setConfirmFresh}
        title={t.welcome.freshTitle}
        description={t.welcome.freshDescription}
        confirmLabel={t.welcome.freshConfirm}
        cancelLabel={t.welcome.freshCancel}
        destructive
        onConfirm={() => {
          state.resetTrip();
          useTripStore.getState().startTrip();
        }}
      />
    </div>
  );
}
