import * as React from "react";
import { cn } from "@/lib/utils/cn";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full min-w-0 rounded-lg border border-input bg-card px-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground/70",
        "focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-ring/25",
        "aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
