import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./Utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#1a1a1a] text-white",
        secondary: "border-transparent bg-[#f0f0f0] text-[#4b5563]",
        outline: "border-[#e5e5e5] text-[#4b5563] bg-transparent",
        success: "border-transparent bg-emerald-50 text-emerald-700",
        warning: "border-transparent bg-amber-50 text-amber-700",
        destructive: "border-transparent bg-red-50 text-red-600",
        info: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        vip: "border-transparent bg-[#1a1a1a] text-white",
        regular: "border-transparent bg-[#f0f0f0] text-[#4b5563]",
        available: "border-transparent bg-emerald-50 text-emerald-700",
        disabled: "border-transparent bg-[#f5f5f5] text-[#9ca3af]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
