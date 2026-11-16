import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

/** A card styled like a paper receipt, optionally with a torn bottom edge. */
export function Receipt({ children, className, torn = true }: { children: ReactNode; className?: string; torn?: boolean }) {
  return (
    <div className={cn("surface relative px-5 pt-5 pb-6 sm:px-7 sm:pt-6", torn && "torn-bottom mb-3 rounded-b-none", className)}>
      {children}
    </div>
  );
}

/** "Label ........ value" line, like a printed bill. */
export function LeaderRow({
  label,
  value,
  className,
  valueClassName,
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="min-w-0 shrink">{label}</span>
      <span aria-hidden className="min-w-4 flex-1 translate-y-[-0.3em] border-b-2 border-dotted border-border-strong" />
      <span className={cn("shrink-0 font-mono tabular-nums", valueClassName)}>{value}</span>
    </div>
  );
}

/** A dashed rule across a card. */
export function ReceiptRule({ className }: { className?: string }) {
  return <hr className={cn("my-4 border-0 border-t border-dashed border-border-strong", className)} />;
}

/** Terracotta rubber stamp. `animate` makes it thunk down when it first appears. */
export function Stamp({ children, className, animate = false }: { children: ReactNode; className?: string; animate?: boolean }) {
  return (
    <motion.span
      initial={animate ? { scale: 1.8, opacity: 0, rotate: -14 } : false}
      animate={{ scale: 1, opacity: 1, rotate: -8 }}
      transition={{ type: "spring", stiffness: 420, damping: 18, delay: animate ? 0.25 : 0 }}
      className={cn(
        "pointer-events-none inline-block rounded-sm border-2 border-accent-2 px-2.5 py-1 font-mono text-xs font-semibold tracking-[0.2em] whitespace-nowrap text-accent-2 uppercase select-none",
        className,
      )}
    >
      {children}
    </motion.span>
  );
}
