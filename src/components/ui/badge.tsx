import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary",
        secondary:
          "border-transparent bg-muted text-muted-foreground",
        destructive:
          "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-400",
        outline:
          "border-border/60 text-muted-foreground bg-card",
        success:
          "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-400",
        warning:
          "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-400",
        info:
          "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/50 dark:text-sky-400",
        pulse:
          "border-transparent bg-primary/10 text-primary animate-glow-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
