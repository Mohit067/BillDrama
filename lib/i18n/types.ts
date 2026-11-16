export type Language = "en" | "hinglish";

export const LANGUAGES: Language[] = ["en", "hinglish"];
export const DEFAULT_LANGUAGE: Language = "en";

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "hinglish";
}

/** A value provided in every supported language. */
export type Localized<T> = Record<Language, T>;
