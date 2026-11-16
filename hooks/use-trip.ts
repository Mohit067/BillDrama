"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTripStore } from "@/lib/store/trip-store";
import { computeLiveSummary, computeResult, type LiveExpenseSummary } from "@/lib/store/trip-selectors";
import type { ExpenseCalculationResult } from "@/types/settlement";

/** The slice of trip data that every calculation depends on. */
function useTripData() {
  return useTripStore(
    useShallow((s) => ({
      participants: s.participants,
      expenses: s.expenses,
      currency: s.currency,
      destination: s.destination,
      revealed: s.revealed,
    })),
  );
}

/** Running totals while amounts are still being typed. */
export function useLiveSummary(): LiveExpenseSummary {
  const data = useTripData();
  return useMemo(() => computeLiveSummary(data), [data]);
}

/** Full settlement result from the engine, or null while any amount is invalid. */
export function useTripResult(): ExpenseCalculationResult | null {
  const data = useTripData();
  return useMemo(() => {
    try {
      return computeResult(data);
    } catch {
      return null;
    }
  }, [data]);
}

/** Looks up a participant's avatar colour by id. */
export function useColorOf(): (id: string) => number {
  const participants = useTripStore((s) => s.participants);
  return useMemo(() => {
    const map = new Map(participants.map((p) => [p.id, p.colorIndex]));
    return (id: string) => map.get(id) ?? 0;
  }, [participants]);
}
