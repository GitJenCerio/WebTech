import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./Utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-none border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ink/20 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-ink text-pearl",
        secondary: "border-transparent bg-ash text-[#57534e]",
        outline: "border-border text-[#57534e] bg-transparent",
        success: "border-transparent bg-[#e4ebe3] text-[#3d5340]",
        warning: "border-transparent bg-[#efe6d8] text-[#5c4a32]",
        completed: "border-transparent bg-[#3d5340] text-pearl",
        destructive: "border-transparent bg-[#f5ebe8] text-[#5a3830]",
        info: "border-transparent bg-[#d6e6f0] text-[#3d6a8a]",
        vip: "border-transparent bg-ink text-pearl",
        regular: "border-transparent bg-ash text-[#57534e]",
        available: "border-transparent bg-[#a34436] text-pearl",
        confirmed: "border-transparent bg-[#8a7864] text-pearl",
        disabled: "border-transparent bg-ash-soft text-muted-foreground",
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
