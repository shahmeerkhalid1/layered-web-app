"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={onPrev}
          aria-label="Previous"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={onNext}
          aria-label="Next"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button type="button" variant="secondary" className="rounded-full" onClick={onToday}>
          Today
        </Button>
        <h1 className="min-w-0 px-2 text-lg font-semibold tracking-[-0.02em] text-foreground md:text-xl">
          {title}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-border bg-muted/30 p-0.5">
          <button
            type="button"
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              mode === "week"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onModeChange("week")}
          >
            Week
          </button>
          <button
            type="button"
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              mode === "month"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onModeChange("month")}
          >
            Month
          </button>
        </div>
        <Button type="button" className="rounded-full" onClick={onNewClass}>
          <Plus className="mr-1 size-4" aria-hidden />
          New class
        </Button>
      </div>
    </div>
  );
}
