"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayButtonProps } from "react-day-picker";

import { cn } from "./Utils";
import { buttonVariants } from "./Button";

const DayButtonWithWhiteSelected = React.forwardRef<
  HTMLButtonElement,
  DayButtonProps
>(function DayButtonWithWhiteSelected({ modifiers, className, ...props }, ref) {
  const isSelected =
    modifiers.selected || modifiers.range_start || modifiers.range_end;
  return (
    <button
      ref={ref}
      {...props}
      className={cn(className, isSelected && "!text-white")}
    />
  );
});

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("rdp-root p-4 rounded-2xl", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium text-[#1a1a1a]",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-8 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-2xl border-[#e5e5e5] hover:border-[#1a1a1a]",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-8 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-2xl border-[#e5e5e5] hover:border-[#1a1a1a]",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-gray-500 rounded-xl w-9 font-normal text-[0.75rem]",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal rounded-2xl text-[#1a1a1a] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]",
        ),
        selected:
          "bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] hover:text-white focus:bg-[#1a1a1a]",
        today: "bg-[#f0f0f0] text-[#1a1a1a] font-semibold",
        outside: "text-gray-400 opacity-50",
        disabled: "text-gray-300 opacity-50",
        range_start: "rounded-l-2xl bg-[#1a1a1a] text-white",
        range_end: "rounded-r-2xl bg-[#1a1a1a] text-white",
        range_middle: "bg-[#f5f5f5] text-[#1a1a1a] rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        DayButton: DayButtonWithWhiteSelected,
        Chevron: ({ orientation, className, ...props }: { orientation?: "left" | "right" | "up" | "down"; className?: string; size?: number; disabled?: boolean }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className={cn("size-4", className)} {...props} />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
