import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./Utils";

const alertVariants = cva(
  "relative w-full rounded-2xl border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-white text-[#212529] border-gray-200",
        destructive:
          "text-red-600 bg-red-50 border-red-200 [&>svg]:text-red-600 *:data-[slot=alert-description]:text-red-700",
        success:
          "text-green-600 bg-green-50 border-green-200 [&>svg]:text-green-600 *:data-[slot=alert-description]:text-green-700",
        warning:
          "text-yellow-600 bg-yellow-50 border-yellow-200 [&>svg]:text-yellow-600 *:data-[slot=alert-description]:text-yellow-700",
        info:
          "text-blue-600 bg-blue-50 border-blue-200 [&>svg]:text-blue-600 *:data-[slot=alert-description]:text-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-semibold tracking-tight text-[#212529]",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-gray-600 col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
