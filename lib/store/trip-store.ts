import { create } from "zustand";
import type { CurrencyCode, Destination, TripSession, TripStep } from "@/types/trip";
import { DEFAULT_CURRENCY } from "@/lib/calculations/money-utils";
import { clearTripSession, loadTripSession, saveTripSession } from "@/lib/storage/trip-storage";
import { createSeed } from "@/lib/utils/funny-messages";
import type { Language } from "@/lib/i18n/types";
import { createId } from "@/lib/utils/id";
import { nextColorIndex } from "@/lib/utils/avatar";
import { sanitizeText, validateAmountInput, validateParticipantName, type NameValidationResult } from "@/lib/utils/validation";
import { computeResult, getMaxAccessibleStep } from "./trip-selectors";

export interface TripActions {
  /** Loads a saved session from LocalStorage. Returns true if one was restored. */
  hydrate: () => boolean;
  /** Welcome CTA → destination step (keeps any existing data). */
  startTrip: () => void;
  /** Throws everything away and starts a brand-new session on the welcome screen. */
  resetTrip: () => void;
  /** Fills in a clearly-labelled sample trip. */
  loadDemoTrip: () => void;
  goToStep: (step: TripStep) => boolean;
  selectDestination: (destination: Destination) => void;
  /** `language` only affects the wording of a returned validation error. */
  addParticipant: (rawName: string, language?: Language) => NameValidationResult;
  /** Adds a person together with what they paid — the one-row "Name + Amount + Add" form. */
  addPerson: (rawName: string, rawAmount: string, language?: Language) => AddPersonResult;
  renameParticipant: (id: string, rawName: string, language?: Language) => NameValidationResult;
  removeParticipant: (id: string) => void;
  setExpense: (participantId: string, raw: string) => void;
  setCurrency: (code: CurrencyCode) => void;
  /** Runs the engine; on success marks the trip as revealed and opens the results. */
  reveal: () => boolean;
}

export type TripState = TripSession & TripActions & { hasHydrated: boolean };

export type AddPersonResult =
  | { success: true; name: string }
  | { success: false; nameError?: string; amountError?: string };

export function createFreshSession(): TripSession {
  const seed = createSeed();
  const now = new Date().toISOString();
  return {
    version: 2,
    sessionId: createId("trip"),
    seed,
    step: 0,
    destination: null,
    participants: [],
    expenses: {},
    currency: DEFAULT_CURRENCY,
    revealed: false,
    isDemo: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function pickSession(state: TripState): TripSession {
  return {
    version: state.version,
    sessionId: state.sessionId,
    seed: state.seed,
    step: state.step,
    destination: state.destination,
    participants: state.participants,
    expenses: state.expenses,
    currency: state.currency,
    revealed: state.revealed,
    isDemo: state.isDemo,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  };
}

/** Has the user entered anything worth protecting from accidental loss? */
export function sessionHasData(s: Pick<TripSession, "destination" | "participants">): boolean {
  return s.destination !== null || s.participants.length > 0;
}

const DEMO_SQUAD: Array<[string, string]> = [
  ["Mohit", "5000"],
  ["Rahul", "8000"],
  ["Aman", "2000"],
  ["Priya", "4000"],
  ["Sneha", "1000"],
];

export const useTripStore = create<TripState>()((set, get) => {
  /** Applies a data change. Any edit invalidates a previous reveal. */
  const update = (patch: Partial<TripSession>, keepReveal = false) =>
    set({ ...patch, ...(keepReveal ? {} : { revealed: false }), updatedAt: new Date().toISOString() });

  return {
    ...createFreshSession(),
    hasHydrated: false,

    hydrate: () => {
      const saved = loadTripSession();
      if (saved) {
        // Never land on a step the restored data doesn't support.
        const step = Math.min(saved.step, getMaxAccessibleStep(saved)) as TripStep;
        set({ ...saved, step, hasHydrated: true });
        return sessionHasData(saved);
      }
      set({ hasHydrated: true });
      return false;
    },

    startTrip: () => update({ step: 1 }, true),

    resetTrip: () => {
      clearTripSession();
      set({ ...createFreshSession() });
    },

    loadDemoTrip: () => {
      const fresh = createFreshSession();
      const participants = DEMO_SQUAD.map(([name], colorIndex) => ({ id: createId("p"), name, colorIndex }));
      const expenses = Object.fromEntries(participants.map((p, i) => [p.id, DEMO_SQUAD[i][1]]));
      set({
        ...fresh,
        isDemo: true,
        destination: { id: "goa", name: "Goa", emoji: "🏖️", isCustom: false },
        participants,
        expenses,
        step: 2,
      });
    },

    goToStep: (step) => {
      const state = get();
      if (step !== 0 && step > getMaxAccessibleStep(state)) return false;
      set({ step });
      return true;
    },

    selectDestination: (destination) =>
      update({ destination: { ...destination, name: sanitizeText(destination.name) } }),

    addParticipant: (rawName, language = "en") => {
      const { participants } = get();
      const result = validateParticipantName(rawName, participants, undefined, language);
      if (result.success) {
        const participant = {
          id: createId("p"),
          name: result.name,
          colorIndex: nextColorIndex(participants.map((p) => p.colorIndex)),
        };
        update({ participants: [...participants, participant] });
      }
      return result;
    },

    addPerson: (rawName, rawAmount, language = "en") => {
      const { participants, expenses, currency } = get();
      const name = validateParticipantName(rawName, participants, undefined, language);
      const amount = validateAmountInput(rawAmount, currency, language);
      if (!name.success || !amount.success) {
        return {
          success: false,
          nameError: name.success ? undefined : name.error,
          amountError: amount.success ? undefined : amount.error,
        };
      }
      const participant = {
        id: createId("p"),
        name: name.name,
        colorIndex: nextColorIndex(participants.map((p) => p.colorIndex)),
      };
      update({
        participants: [...participants, participant],
        expenses: { ...expenses, [participant.id]: rawAmount.trim() },
      });
      return { success: true, name: name.name };
    },

    renameParticipant: (id, rawName, language = "en") => {
      const { participants } = get();
      const result = validateParticipantName(rawName, participants, id, language);
      if (result.success) {
        update({ participants: participants.map((p) => (p.id === id ? { ...p, name: result.name } : p)) });
      }
      return result;
    },

    removeParticipant: (id) => {
      const { participants, expenses } = get();
      const rest = { ...expenses };
      delete rest[id];
      update({ participants: participants.filter((p) => p.id !== id), expenses: rest });
    },

    setExpense: (participantId, raw) => {
      const { expenses, participants } = get();
      if (!participants.some((p) => p.id === participantId)) return;
      if (expenses[participantId] === raw) return;
      update({ expenses: { ...expenses, [participantId]: raw } });
    },

    setCurrency: (code) => {
      if (get().currency !== code) update({ currency: code });
    },

    reveal: () => {
      const state = get();
      try {
        if (!computeResult(state)) return false;
      } catch {
        return false;
      }
      update({ revealed: true, step: 3 }, true);
      return true;
    },
  };
});

/* Persist every change once the saved session has been loaded (avoids overwriting it on boot). */
useTripStore.subscribe((state) => {
  if (state.hasHydrated) saveTripSession(pickSession(state));
});
