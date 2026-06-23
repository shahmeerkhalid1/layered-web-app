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
  classCount = 0,
  isCurrentPeriod = false,
}: CalendarHeaderProps) {
  const statsLabel =
    classCount === 0
      ? `No classes in this ${mode === "week" ? "week" : "month"}`
      : `${classCount} class${classCount === 1 ? "" : "es"} scheduled`;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between rounded-3xl border border-border px-4 py-5 md:px-6 md:py-6 bg-card shadow-lg">
      
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-secondary-foreground">
          <Calendar className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-xl font-semibold tracking-[-0.02em] text-foreground md:text-lg uppercase">
            Calendar
          </h1>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">
            {statsLabel}
            <span className="text-muted-foreground/50"> · </span>
            {mode === "week" ? "Week view" : "Month view"}
            <span className="text-muted-foreground/50"> · </span>
            Click an empty slot to quick-schedule
          </p>
        </div>
      </div>

      <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={onPrev}
          aria-label={mode === "week" ? "Previous week" : "Previous month"}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant={isCurrentPeriod ? "secondary" : "outline"}
          className="rounded-full"
          onClick={onToday}
          disabled={isCurrentPeriod}
        >
          Today
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={onNext}
          aria-label={mode === "week" ? "Next week" : "Next month"}
        >
          <ChevronRight className="size-4" />
        </Button>

        <div
          className="mx-0.5 hidden h-6 w-px bg-border sm:block"
          aria-hidden
        />

        <div className="flex rounded-full border border-border bg-muted/30 p-0.5">
          <Button
            type="button"
            variant={mode === "week" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-7 rounded-full px-3 text-xs font-medium shadow-none",
              mode !== "week" && "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onModeChange("week")}
          >
            Week
          </Button>
          <Button
            type="button"
            variant={mode === "month" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-7 rounded-full px-3 text-xs font-medium shadow-none",
              mode !== "month" && "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onModeChange("month")}
          >
            Month
          </Button>
        </div>

        <Button type="button" className="rounded-full" onClick={onNewClass}>
          <Plus className="size-4" aria-hidden />
          New class
        </Button>
      </div>
    </div>
  );
}
