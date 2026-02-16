"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "./Utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border bg-gray-50 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-[#495057] data-[state=checked]:to-[#212529] data-[state=checked]:text-white data-[state=checked]:border-[#212529] focus-visible:border-[#212529] focus-visible:ring-[#212529]/50 aria-invalid:ring-red-500/20 aria-invalid:border-red-500 size-4 shrink-0 rounded-md border-gray-300 shadow-sm transition-all outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
