import { DEFAULT_LANGUAGE, isLanguage, type Language } from "@/lib/i18n/types";

/**
 * App-wide preferences — kept separate from the trip so "Start over" never resets them.
 * (The colour theme is stored by next-themes under its own key.)
 */
export const PREFERENCES_STORAGE_KEY = "billdrama:preferences:v1";

export interface Preferences {
  language: Language;
}

export const DEFAULT_PREFERENCES: Preferences = { language: DEFAULT_LANGUAGE };

export function loadPreferences(): Preferences {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const data = JSON.parse(raw) as Partial<Preferences>;
    return { language: isLanguage(data.language) ? data.language : DEFAULT_LANGUAGE };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Preferences): void {
  try {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // storage unavailable — preferences just won't persist
  }
}
