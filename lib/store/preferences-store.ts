import { create } from "zustand";
import { getDictionary, DEFAULT_LANGUAGE, type Dictionary, type Language } from "@/lib/i18n";
import { loadPreferences, savePreferences } from "@/lib/storage/preferences-storage";

interface PreferencesState {
  language: Language;
  hydrate: () => void;
  setLanguage: (language: Language) => void;
}

function applyLanguage(language: Language) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = getDictionary(language).meta.htmlLang;
}

/** Language preference. (Theme lives in next-themes.) */
export const usePreferencesStore = create<PreferencesState>()((set) => ({
  language: DEFAULT_LANGUAGE,

  hydrate: () => {
    const { language } = loadPreferences();
    applyLanguage(language);
    set({ language });
  },

  setLanguage: (language) => {
    applyLanguage(language);
    set({ language });
    savePreferences({ language });
  },
}));

/** Current UI dictionary. */
export function useT(): Dictionary {
  return getDictionary(usePreferencesStore((s) => s.language));
}

export function useLanguage(): Language {
  return usePreferencesStore((s) => s.language);
}

/** Non-hook access (event handlers, schema getters). */
export const getLanguage = () => usePreferencesStore.getState().language;
