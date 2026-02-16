import * as React from "react";

import { cn } from "./Utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-2xl border border-[#adb5bd] bg-gray-50 px-4 py-2 text-sm text-gray-900 transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 hover:border-[#6c757d] focus-visible:outline-2 focus-visible:outline-[#212529] focus-visible:outline-offset-2 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 box-border",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
