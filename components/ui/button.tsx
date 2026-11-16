import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition-[background-color,border-color,color,transform] duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/45 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:translate-y-px",
        outline: "border border-border-strong bg-card text-foreground hover:border-muted-foreground/60 hover:bg-elevated/50",
        secondary: "bg-elevated text-foreground hover:bg-elevated/70",
        ghost: "text-muted-foreground hover:bg-elevated/70 hover:text-foreground",
        // Tinted rather than solid: solid terracotta can't carry small text at 4.5:1 in either theme.
        destructive: "border border-danger/60 bg-danger-soft text-foreground hover:bg-danger/20",
        link: "text-foreground underline decoration-accent decoration-2 underline-offset-4 hover:decoration-foreground",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        default: "h-11 px-4 text-[15px]",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
      },
    },
    // Text links shouldn't inherit a button's height/padding.
    compoundVariants: [{ variant: "link", class: "h-auto px-0 py-0.5" }],
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
