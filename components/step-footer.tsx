"use client";

import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/store/preferences-store";

/**
 * Back / main-action bar. Sticks to the bottom of the screen on phones so the
 * main button is always under the thumb.
 */
export function StepFooter({
  onBack,
  onContinue,
  continueLabel,
  canContinue = true,
  busy = false,
  hint,
  above,
}: {
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: ReactNode;
  canContinue?: boolean;
  busy?: boolean;
  hint?: ReactNode;
  /** Optional line shown above the buttons. */
  above?: ReactNode;
}) {
  const t = useT();
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-8 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
      {above}
      <div className="flex items-center gap-2">
        {onBack && (
          <Button variant="outline" size="lg" onClick={onBack} className="px-4" aria-label={t.common.back}>
            <ArrowLeft /> <span className="hidden sm:inline">{t.common.back}</span>
          </Button>
        )}
        <Button size="lg" onClick={onContinue} disabled={!canContinue || busy} aria-busy={busy} className="flex-1 sm:ml-auto sm:min-w-56 sm:flex-none">
          {busy ? <Loader2 className="animate-spin" /> : null}
          {continueLabel ?? t.common.continue}
          {!busy && <ArrowRight />}
        </Button>
      </div>
      {hint && !canContinue && (
        <p role="status" className="mt-2 text-center text-sm text-muted-foreground sm:text-right">
          {hint}
        </p>
      )}
    </div>
  );
}
