import * as React from "react";

import { cn } from "./Utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-2xl border border-[#adb5bd] bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 hover:border-[#6c757d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#212529] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
