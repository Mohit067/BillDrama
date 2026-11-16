"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LanguageSwitcher, ThemeToggle } from "@/components/preference-controls";
import { sessionHasData, useTripStore } from "@/lib/store/trip-store";
import { useT } from "@/lib/store/preferences-store";

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path d="M5 2.5h14v19l-2.33-1.75L14.33 21.5 12 19.75 9.67 21.5 7.33 19.75 5 21.5z" fill="var(--primary-foreground)" />
          <path d="M8.5 8h7M8.5 11.5h7" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8.5 15h4" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="font-serif text-[26px] leading-none text-foreground">
        Bill<em className="text-accent">Drama</em>
      </span>
    </span>
  );
}

export function AppHeader() {
  const t = useT();
  const destination = useTripStore((s) => s.destination);
  const participants = useTripStore((s) => s.participants);
  const isDemo = useTripStore((s) => s.isDemo);
  const resetTrip = useTripStore((s) => s.resetTrip);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasData = sessionHasData({ destination, participants });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <button
          type="button"
          onClick={() => useTripStore.getState().goToStep(0)}
          className="shrink-0 rounded-md focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:outline-none"
          aria-label={t.header.homeAria}
        >
          <Wordmark />
        </button>

        <div className="flex items-center gap-1.5">
          {isDemo && (
            <span className="hidden rounded-md bg-accent-soft px-2 py-1 text-xs font-semibold text-foreground sm:inline">{t.header.demoTrip}</span>
          )}
          {hasData && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)} className="px-2 text-[13px]" aria-label={t.header.startOver}>
              <RotateCcw className="sm:hidden" />
              <span className="hidden sm:inline">{t.header.startOver}</span>
            </Button>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </nav>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t.reset.title}
        description={t.reset.description}
        confirmLabel={t.reset.confirm}
        cancelLabel={t.reset.cancel}
        destructive
        onConfirm={() => {
          resetTrip();
          toast(t.reset.toast);
        }}
      />
    </header>
  );
}
