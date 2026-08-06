import * as React from "react";
import { cn } from "./Utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-none border border-input bg-pearl px-3 py-2 text-base text-ink ring-offset-pearl placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export type TextareaProps = React.ComponentPropsWithRef<typeof Textarea>;
export { Textarea };
