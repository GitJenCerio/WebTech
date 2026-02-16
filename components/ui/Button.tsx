import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./Utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-[#495057] to-[#212529] text-white hover:from-[#343a40] hover:to-[#212529] shadow-md hover:shadow-lg active:scale-[0.98]",
        dark: "bg-gradient-to-br from-[#495057] to-[#212529] text-white hover:from-[#343a40] hover:to-[#212529] shadow-md hover:shadow-lg active:scale-[0.98]",
        primary:
          "bg-black text-white border-2 border-white shadow-[0_0_0_2px_#000000] hover:bg-white hover:text-black hover:border-black hover:shadow-[0_0_0_2px_#ffffff,0_0_0_3px_#000000] active:scale-[0.98]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]",
        outline:
          "border border-gray-300 bg-transparent text-[#212529] hover:border-gray-400 hover:bg-gray-50 active:scale-[0.98]",
        secondary:
          "bg-gray-100 text-[#212529] hover:bg-gray-200 active:scale-[0.98]",
        ghost:
          "hover:bg-gray-100 text-[#212529] active:scale-[0.98]",
        link: "text-[#212529] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-2xl gap-1.5 px-3 has-[>svg]:px-2.5 text-sm",
        lg: "h-12 rounded-2xl px-6 has-[>svg]:px-4",
        icon: "size-10 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
export type ButtonSize = VariantProps<typeof buttonVariants>['size'];
