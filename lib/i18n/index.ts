import { en, type Dictionary } from "./en";
import { hinglish } from "./hinglish";
import type { Language } from "./types";

export type { Dictionary } from "./en";
export * from "./types";

const DICTIONARIES: Record<Language, Dictionary> = { en, hinglish };

export function getDictionary(language: Language): Dictionary {
  return DICTIONARIES[language] ?? en;
}
