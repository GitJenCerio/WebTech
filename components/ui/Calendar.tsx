"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./Utils";
import { buttonVariants } from "./Button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium text-[#212529]",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-2xl",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-gray-600 rounded-2xl w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-gray-100 [&:has([aria-selected].day-range-end)]:rounded-r-2xl",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-2xl [&:has(>.day-range-start)]:rounded-l-2xl first:[&:has([aria-selected])]:rounded-l-2xl last:[&:has([aria-selected])]:rounded-r-2xl"
            : "[&:has([aria-selected])]:rounded-2xl",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100 rounded-2xl",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-gradient-to-br aria-selected:from-[#495057] aria-selected:to-[#212529] aria-selected:text-white",
        day_range_end:
          "day-range-end aria-selected:bg-gradient-to-br aria-selected:from-[#495057] aria-selected:to-[#212529] aria-selected:text-white",
        day_selected:
          "bg-gradient-to-br from-[#495057] to-[#212529] text-white hover:from-[#343a40] hover:to-[#212529] focus:from-[#495057] focus:to-[#212529]",
        day_today: "bg-gray-100 text-[#212529] font-semibold",
        day_outside:
          "day-outside text-gray-400 aria-selected:text-gray-400",
        day_disabled: "text-gray-400 opacity-50",
        day_range_middle:
          "aria-selected:bg-gray-100 aria-selected:text-[#212529]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
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
