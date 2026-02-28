"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayButtonProps } from "react-day-picker";

import { cn } from "./Utils";
import { buttonVariants } from "./Button";

function MonthWithCaptionRow(props: React.HTMLAttributes<HTMLDivElement> & { calendarMonth?: unknown; displayIndex?: number }) {
  const { children, className, style, displayIndex: _displayIndex, calendarMonth: _calendarMonth, ...rest } = props;
  const childArray = React.Children.toArray(children).filter(Boolean);
  // With navLayout="around": [PreviousButton, MonthCaption, NextButton, MonthGrid]
  const hasNavAround = childArray.length >= 4;
  if (!hasNavAround) {
    return <div className={cn("flex flex-col gap-4", className)} style={style} {...rest}>{children}</div>;
  }
  const [prev, caption, next, ...restChildren] = childArray;
  return (
    <div className={cn("flex flex-col gap-4", className)} style={style} {...rest}>
      <div className="flex flex-row items-center justify-between gap-2 w-full">
        {prev}
        {caption}
        {next}
      </div>
      {restChildren}
    </div>
  );
}

function DayButtonWithWhiteSelected({ modifiers, className, ...props }: DayButtonProps) {
  const isSelected = modifiers.selected || modifiers.range_start || modifiers.range_end;
  return (
    <button
      {...props}
      className={cn(className, isSelected && "!text-white !bg-[#1a1a1a] hover:!text-white hover:!bg-[#2d2d2d]")}
    />
  );
}

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
        month_caption: "flex flex-row items-center justify-between gap-2 pt-1 w-full",
        caption_label: "text-sm font-medium text-[#1a1a1a] flex-1 text-center shrink-0",
        nav: "flex items-center gap-1 shrink-0",
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
          "!text-white bg-[#1a1a1a] hover:bg-[#2d2d2d] hover:!text-white focus:bg-[#1a1a1a] focus:!text-white",
        today: "bg-[#f0f0f0] text-[#1a1a1a] font-semibold",
        outside: "text-gray-400 opacity-50",
        disabled: "text-gray-300 opacity-50",
        range_start: "rounded-l-2xl bg-[#1a1a1a] text-white",
        range_end: "rounded-r-2xl bg-[#1a1a1a] text-white",
        range_middle: "bg-[#f5f5f5] !text-[#1a1a1a] rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Month: MonthWithCaptionRow,
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
