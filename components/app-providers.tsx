"use client";

import type { ReactNode } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

/** Must match the key used by next-themes so tests/devtools can find it. */
export const THEME_STORAGE_KEY = "billdrama-theme";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      closeButton
      toastOptions={{
        classNames: {
          toast: "!bg-card !text-foreground !border-border !shadow-card font-sans",
          description: "!text-muted-foreground",
          closeButton: "!bg-card !border-border !text-muted-foreground",
          error: "[&_[data-icon]]:!text-danger",
          success: "[&_[data-icon]]:!text-success",
        },
      }}
    />
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    // attribute="class" pairs with Tailwind's dark variant; next-themes injects a tiny
    // blocking script so the right theme is applied before first paint (no flash).
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey={THEME_STORAGE_KEY}>
      <TooltipProvider delayDuration={150}>
        {children}
        <ThemedToaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
