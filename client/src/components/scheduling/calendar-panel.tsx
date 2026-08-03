"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import {
  CalendarHeader,
  CalendarStatusBanner,
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
    <div className="space-y-6">
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

      {!loading && !error ? (
        <CalendarStatusBanner mode={mode} classCount={classCount} />
      ) : null}

      {loading ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded border border-dashed border-border bg-muted/15 py-16"
          aria-busy
          aria-label="Loading calendar"
        >
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading your schedule…</p>
        </div>
      ) : null}

      {error ? (
        <div
          className="rounded border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!loading && !error ? children : null}
    </div>
  );
}
