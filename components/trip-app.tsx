"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { toast } from "sonner";
import { useTripStore } from "@/lib/store/trip-store";
import { usePreferencesStore, useT } from "@/lib/store/preferences-store";
import { getDictionary } from "@/lib/i18n";
import { AppHeader, Wordmark } from "./app-header";
import { WelcomeScreen } from "./welcome-screen";
import { TripStep } from "./trip-step";
import { PeopleStep } from "./people-step";
import { ResultsScreen } from "./results-screen";

export function TripApp() {
  const t = useT();
  const hasHydrated = useTripStore((s) => s.hasHydrated);
  const step = useTripStore((s) => s.step);
  const [celebrate, setCelebrate] = useState(false);
  const hydratedOnce = useRef(false);

  // Restore preferences + any unfinished trip from this device (client only, once).
  useEffect(() => {
    if (hydratedOnce.current) return;
    hydratedOnce.current = true;
    usePreferencesStore.getState().hydrate();
    const restored = useTripStore.getState().hydrate();
    const { destination, step: restoredStep } = useTripStore.getState();
    if (restored && restoredStep > 0) {
      toast(getDictionary(usePreferencesStore.getState().language).restored(destination?.name ?? null));
    }
  }, []);

  useEffect(() => {
    if (hasHydrated) window.scrollTo({ top: 0 });
  }, [step, hasHydrated]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <Wordmark />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <AppHeader />
      <main id="main" className="mx-auto w-full max-w-5xl overflow-x-clip px-4 pt-8 pb-12 sm:pt-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && <WelcomeScreen />}
            {step === 1 && <TripStep />}
            {step === 2 && <PeopleStep onRevealed={() => setCelebrate(true)} />}
            {step === 3 && <ResultsScreen celebrate={celebrate} onCelebrated={() => setCelebrate(false)} />}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="mx-auto max-w-5xl border-t border-border px-4 py-6 pb-24 text-sm text-muted-foreground sm:pb-8">{t.common.footer}</footer>
    </MotionConfig>
  );
}
