"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = DayPickerProps;

const calendarClassNames: NonNullable<DayPickerProps["classNames"]> = {
  root: "rdp-themed w-fit bg-transparent text-foreground",
  months: "relative flex flex-col gap-4 sm:flex-row",
  month: "flex w-full flex-col gap-4",
  month_caption: "relative flex h-8 w-full items-center justify-center px-8",
  caption_label: "select-none text-sm font-medium flex items-center justify-center",
  dropdowns: "flex h-8 w-full items-center justify-center gap-1.5 text-sm font-medium",
  dropdown_root:
    "relative inline-flex items-center bg-background px-2  has-focus:border-ring has-focus:ring-[3px] has-focus:ring-ring/50 dark:bg-input/30",
  dropdown: "absolute inset-0 cursor-pointer opacity-0 ",
  months_dropdown: "cursor-inherit appearance-none bg-background pr-6 pl-2 text-sm ",
  years_dropdown: "cursor-inherit appearance-none bg-background pr-6 pl-2 text-sm",
  nav: "flex items-center gap-1",
  button_previous: cn(
    buttonVariants({ variant: "outline" }),
    "absolute left-0 top-0 z-10 size-8 bg-transparent p-0 opacity-80 hover:opacity-100"
  ),
  button_next: cn(
    buttonVariants({ variant: "outline" }),
    "absolute right-0 top-0 z-10 size-8 bg-transparent p-0 opacity-80 hover:opacity-100"
  ),
  month_grid: "w-full border-collapse",
  weekdays: "flex",
  weekday:
    "w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground",
  week: "mt-2 flex w-full",
  week_number_header: "w-9 text-[0.8rem] font-normal text-muted-foreground",
  week_number: "text-[0.8rem] text-muted-foreground",
  day: cn(
    "group/day relative aspect-square h-9 w-9 p-0 text-center text-sm",
    "focus-within:relative focus-within:z-10",
    "[&:has([aria-selected])]:bg-accent",
    "data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md",
    "data-[range-middle=true]:rounded-none",
    "data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md"
  ),
  day_button: cn(
    buttonVariants({ variant: "ghost" }),
    "size-9 p-0 font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10",
    "group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50",
    "aria-selected:opacity-100"
  ),
  range_start: "rounded-l-md bg-accent",
  range_middle: "rounded-none bg-accent",
  range_end: "rounded-r-md bg-accent",
  selected:
    "rounded-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
  today: "rounded-md bg-accent text-accent-foreground",
  outside:
    "text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
  disabled: "text-muted-foreground opacity-50",
  hidden: "invisible",
  chevron: "size-4 fill-muted-foreground bg-none fill-none",
};

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        ...calendarClassNames,
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...chevronProps }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : orientation === "up"
                  ? ChevronUp
                  : ChevronDown;
          return (
            <Icon className={cn("size-4 bg-none fill-none", chevronClassName)} {...chevronProps} />
          );
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
