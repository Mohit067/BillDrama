import { z } from "zod";
import type { TripSession } from "@/types/trip";
import { CURRENCY_CODES } from "@/lib/calculations/money-utils";
import { MAX_PARTICIPANTS } from "@/lib/utils/validation";

export const TRIP_STORAGE_KEY = "billdrama:trip-session:v1";

/**
 * Schema used to validate whatever comes back from LocalStorage. Data could be
 * stale, hand-edited or corrupted, so it is never trusted blindly.
 */
const tripSessionSchema = z.object({
  /** 1 = old 5-step journey, 2 = current 3-step journey. */
  version: z.union([z.literal(1), z.literal(2)]),
  sessionId: z.string().min(1),
  seed: z.number().int().nonnegative(),
  step: z.number().int().min(0).max(5),
  destination: z
    .object({
      id: z.string().min(1).max(40),
      name: z.string().min(1).max(60),
      emoji: z.string().max(16),
      isCustom: z.boolean(),
    })
    .nullable(),
  participants: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        name: z.string().min(1).max(60),
        colorIndex: z.number().int().nonnegative(),
      }),
    )
    .max(MAX_PARTICIPANTS),
  expenses: z.record(z.string(), z.string().max(32)),
  currency: z.enum(CURRENCY_CODES as [string, ...string[]]),
  revealed: z.boolean(),
  isDemo: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Old sessions used 5 steps (1 place, 2 squad, 3 amounts, 4 review, 5 results).
 * Squad + amounts + review are now one step, so map them across.
 */
function migrate(data: z.infer<typeof tripSessionSchema>): TripSession {
  let step = data.step;
  if (data.version === 1) step = step >= 5 ? 3 : step >= 2 ? 2 : step;
  return { ...data, version: 2, step: Math.min(step, 3) as TripSession["step"], currency: data.currency as TripSession["currency"] };
}

function getStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null; // e.g. storage disabled in private mode
  }
}

/** Returns the saved session, or null if nothing (valid) is stored. Corrupt data is removed. */
export function loadTripSession(): TripSession | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(TRIP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = tripSessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      storage.removeItem(TRIP_STORAGE_KEY);
      return null;
    }
    return migrate(parsed.data);
  } catch {
    storage.removeItem(TRIP_STORAGE_KEY);
    return null;
  }
}

export function saveTripSession(session: TripSession): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(TRIP_STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false; // quota exceeded etc. – the app keeps working in memory
  }
}

export function clearTripSession(): void {
  getStorage()?.removeItem(TRIP_STORAGE_KEY);
}
