import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Inline validation message. The icon carries the danger colour; the words use
 * the regular text colour so they stay readable (terracotta text alone falls
 * below 4.5:1 contrast on cards in both themes).
 */
export function FieldError({ id, children, className }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <p id={id} role="alert" className={cn("mt-1.5 flex items-start gap-1.5 text-sm text-foreground", className)}>
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
