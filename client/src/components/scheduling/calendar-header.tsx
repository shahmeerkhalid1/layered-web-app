"use client";

import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarViewMode = "week" | "month";

export interface CalendarHeaderProps {
  mode: CalendarViewMode;
  onModeChange: (mode: CalendarViewMode) => void;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewClass: () => void;
  classCount?: number;
  isCurrentPeriod?: boolean;
}

export function CalendarHeader({
  mode,
  onModeChange,
  title,
  onPrev,
  onNext,
  onToday,
  onNewClass,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <header className="space-y-2">
        <p className="layered-eyebrow">Calendar</p>
        <h1 className="layered-display-headline">{title}</h1>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded ">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-none border-r border-border"
            onClick={onPrev}
            aria-label={mode === "week" ? "Previous week" : "Previous month"}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-none px-4 text-sm border border-border border-r-0 border-l-0 font-semibold"
            onClick={onToday}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-none border-l border-border"
            onClick={onNext}
            aria-label={mode === "week" ? "Next week" : "Next month"}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex rounded border border-border p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 rounded px-4 text-xs font-medium",
              mode === "week"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onModeChange("week")}
          >
            Week
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 rounded px-4 text-xs font-medium",
              mode === "month"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onModeChange("month")}
          >
            Month
          </Button>
        </div>

        <Button
          type="button"
          className="h-9 rounded bg-primary px-4 text-primary-foreground hover:bg-primary/90"
          onClick={onNewClass}
        >
          <Plus className="size-4" aria-hidden />
          New class
        </Button>
      </div>
    </div>
  );
}

export function CalendarStatusBanner({
  mode,
  classCount,
}: {
  mode: CalendarViewMode;
  classCount: number;
}) {
  const populated = classCount > 0;
  const periodLabel = mode === "week" ? "week" : "month";

  return (
    <div className="flex items-start gap-4 rounded bg-primary dark:bg-primary p-5 text-white">
      <Calendar className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">
          {populated
            ? `${classCount} class${classCount === 1 ? "" : "es"} this ${periodLabel}`
            : "No classes in this period"}
        </p>
        <p className="mt-1 text-sm text-white/70">
          {populated
            ? `${mode === "week" ? "Week" : "Month"} view · click a class to open its plan.`
            : "Click any time slot in the grid below to schedule, or add a new class."}
        </p>
      </div>
    </div>
  );
}
