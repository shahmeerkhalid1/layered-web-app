"use client";

import type { ReactNode } from "react";
import { CalendarDays, Loader2 } from "lucide-react";

import {
  CalendarHeader,
  type CalendarViewMode,
} from "@/components/scheduling/calendar-header";
export interface CalendarPanelProps {
  mode: CalendarViewMode;
  onModeChange: (mode: CalendarViewMode) => void;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewClass: () => void;
  classCount: number;
  isCurrentPeriod: boolean;
  loading: boolean;
  error: string | null;
  children: ReactNode;
}

export function CalendarPanel({
  mode,
  onModeChange,
  title,
  onPrev,
  onNext,
  onToday,
  onNewClass,
  classCount,
  isCurrentPeriod,
  loading,
  error,
  children,
}: CalendarPanelProps) {
  return (
    <div >
    {/* <div className="rounded-3xl border border-border bg-card shadow-lg"> */}
      <div className="border-border/70 px-4 py-5 md:px-6 md:py-6">
        <CalendarHeader
          mode={mode}
          onModeChange={onModeChange}
          title={title}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
          onNewClass={onNewClass}
          classCount={classCount}
          isCurrentPeriod={isCurrentPeriod}
        />
      </div>

      <div className="px-4 py-5 md:px-6 md:py-6">
        {loading ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/15 py-16"
            aria-busy
            aria-label="Loading calendar"
          >
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading your schedule…</p>
          </div>
        ) : null}

        {error ? (
          <div
            className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {!loading && !error && classCount === 0 ? (
          <div className="mb-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/15 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-3">
              <CalendarDays className="size-8 text-muted-foreground/50" aria-hidden />
              <div>
                <p className="font-medium text-foreground">No classes in this period</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {mode === "week"
                    ? "Click any time slot in the grid below to schedule, or add a new class."
                    : "Pick a day to open the week view, or add a new class."}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {!loading && !error ? children : null}
      </div>
    </div>
  );
}
