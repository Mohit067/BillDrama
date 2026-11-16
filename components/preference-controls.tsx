"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES, getDictionary } from "@/lib/i18n";
import { usePreferencesStore, useT } from "@/lib/store/preferences-store";
import { cn } from "@/lib/utils/cn";

/** Two-option English / Hinglish switch. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useT();
  const language = usePreferencesStore((s) => s.language);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);

  return (
    <div role="radiogroup" aria-label={t.header.language} className={cn("inline-flex rounded-lg border border-border p-0.5", className)}>
      {LANGUAGES.map((lang) => {
        const active = lang === language;
        const meta = getDictionary(lang).meta;
        return (
          <button
            key={lang}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={meta.languageName}
            title={meta.languageName}
            onClick={() => setLanguage(lang)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:outline-none",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {meta.languageShort}
          </button>
        );
      })}
    </div>
  );
}

/** True only after hydration — the theme is unknown on the server. */
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * Sun / Moon button that opens Light · Dark · System.
 * The icon reflects what's showing right now (System resolves to one of the two).
 */
export function ThemeToggle() {
  const t = useT();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t.header.theme} title={t.header.theme}>
          {/* Both icons rendered so the swap can cross-fade; only one is visible. */}
          <span className="relative size-[18px]">
            <Sun className={cn("absolute inset-0 size-[18px] transition-all duration-300", isDark ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100")} />
            <Moon className={cn("absolute inset-0 size-[18px] transition-all duration-300", isDark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0")} />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t.header.theme}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mounted ? (theme ?? "system") : "system"} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun /> {t.header.light}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon /> {t.header.dark}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor /> {t.header.system}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
