"use client";

import { useMemo } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CalendarClassInstance } from "@/lib/types";
import {
  instanceStatusLabel,
  weekOverviewCardStatusClasses,
  weekOverviewTimePillStatusClasses,
  weekOverviewTitleStatusClasses,
} from "@/lib/calendar-instance-status-styles";
import {
  addDays,
  formatYmdLocal,
  startOfWeekMonday,
} from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

function WeekClassCard({
  instance,
  onSelect,
}: {
  instance: CalendarClassInstance;
  onSelect: () => void;
}) {
  const start = new Date(instance.time);
  const durationMin = instance.class.durationMinutes ?? 60;
  const isGroup = instance.class.type === "GROUP";
  const statusLabel = instanceStatusLabel(instance.status);
  const classTypeLabel = instance.classType?.trim();
  const classStyleLabel = instance.classStyle?.trim();
  const timeLabel = start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full cursor-pointer gap-3 rounded border px-3 py-3 text-left transition-all",
        "hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        weekOverviewCardStatusClasses(instance.status, isGroup)
      )}
    >
      <div
        className={cn(
          "flex min-w-14 shrink-0 flex-col items-center justify-center rounded-xl px-2 py-1.5 tabular-nums",
          weekOverviewTimePillStatusClasses(instance.status)
        )}
      >
        <span className="text-center text-xs font-semibold leading-tight">{timeLabel}</span>
        <span className="mt-0.5 text-[10px] opacity-80">{durationMin}m</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className={cn("line-clamp-2 font-medium leading-snug capitalize", weekOverviewTitleStatusClasses(instance.status))}>
          {instance.class.title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {statusLabel ? (
            <Badge
              variant={instance.status === "CANCELLED" ? "destructive" : "secondary"}
              className="h-5 rounded-sm px-2 text-[10px] font-semibold uppercase tracking-wide"
            >
              {statusLabel}
            </Badge>
          ) : null}
          <Badge
            variant={ "default"}
            className="h-5 rounded-sm px-2 text-[10px] font-semibold uppercase tracking-wide"
          >
            {instance.class.type}
          </Badge>
          {classTypeLabel ? (
            <Badge
              variant="outline"
              className="h-5 max-w-full truncate rounded-sm border-orange-500/10 bg-orange-500/10 px-2 text-[10px] font-medium normal-case tracking-normal text-foreground"
            >
              {classTypeLabel}
            </Badge>
          ) : null}
          {classStyleLabel ? (
            <Badge
              variant="outline"
              className="h-5 max-w-full truncate rounded-sm border-primary/25 bg-primary/10 px-2 text-[10px] font-medium normal-case tracking-normal text-foreground"
            >
              {classStyleLabel}
            </Badge>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function DaySectionSkeleton() {
  return (
    <div className="flex gap-4 rounded border border-border/60 bg-muted/20 p-4">
      <div className="h-14 w-12 shrink-0 animate-pulse rounded-xl bg-muted" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-16 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export interface WeekOverviewPanelProps {
  weekStart: Date;
  onWeekStartChange: (next: Date | ((prev: Date) => Date)) => void;
  days: Date[];
  grouped: Map<string, CalendarClassInstance[]>;
  loading: boolean;
  error: string | null;
  onSelectInstance: (id: string) => void;
}

export function WeekOverviewPanel({
  weekStart,
  onWeekStartChange,
  days,
  grouped,
  loading,
  error,
  onSelectInstance,
}: WeekOverviewPanelProps) {
  const todayYmd = formatYmdLocal(new Date());
  const currentWeekStart = formatYmdLocal(startOfWeekMonday(new Date()));
  const viewingYmd = formatYmdLocal(weekStart);
  const isCurrentWeek = viewingYmd === currentWeekStart;

  const weekEnd = addDays(weekStart, 6);

  const stats = useMemo(() => {
    let totalClasses = 0;
    let daysWithClasses = 0;
    for (const d of days) {
      const count = grouped.get(formatYmdLocal(d))?.length ?? 0;
      totalClasses += count;
      if (count > 0) daysWithClasses += 1;
    }
    return { totalClasses, daysWithClasses };
  }, [days, grouped]);

  const scrollToDay = (ymd: string) => {
    document.getElementById(`week-day-${ymd}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const dateRangeLabel = `${weekStart.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  })} – ${weekEnd.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;

  const statsLabel =
    loading || error
      ? null
      : stats.totalClasses === 0
        ? "No classes this week"
        : `${stats.totalClasses} class${stats.totalClasses === 1 ? "" : "es"} across ${stats.daysWithClasses} day${stats.daysWithClasses === 1 ? "" : "s"}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <header className="space-y-2 w-full">
          <p className="layered-eyebrow">Scheduling</p>
          <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="layered-display-headline">Week overview</h1>
          <div className="flex items-center rounded">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-none border-r border-border"
              onClick={() => onWeekStartChange((d) => addDays(d, -7))}
              aria-label="Previous week"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-none border border-border border-r-0 border-l-0 px-4 text-sm font-semibold"
              onClick={() => onWeekStartChange(startOfWeekMonday(new Date()))}
              disabled={isCurrentWeek}
            >
              This week
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-none border-l border-border"
              onClick={() => onWeekStartChange((d) => addDays(d, 7))}
              aria-label="Next week"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {dateRangeLabel}
            {statsLabel ? (
              <>
                <span className="text-muted-foreground/50"> · </span>
                {statsLabel}
              </>
            ) : null}
          </p>
        </header>

        
      </div>

      {!loading && !error ? (
        <div className="flex flex-wrap gap-1.5">
          {days.map((d) => {
            const ymd = formatYmdLocal(d);
            const count = grouped.get(ymd)?.length ?? 0;
            const isToday = ymd === todayYmd;
            const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
            return (
              <Button
                key={ymd}
                type="button"
                variant="outline"
                onClick={() => scrollToDay(ymd)}
                className={cn(
                  "h-auto min-h-0 min-w-17 flex-col gap-0 rounded px-2 py-2 font-normal shadow-none",
                  isToday
                    ? "border-[var(--layered-navy)]/30 bg-[var(--layered-light-blue)]/60 text-foreground hover:border-[var(--layered-navy)]/50 hover:bg-[var(--layered-light-blue)]"
                    : "bg-muted/30 text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="text-[10px] font-medium uppercase tracking-wide">
                  {weekday}
                </span>
                <span
                  className={cn(
                    "mt-0.5 text-lg font-semibold tabular-nums leading-none",
                    isToday && "text-[var(--layered-navy)]",
                  )}
                >
                  {d.getDate()}
                </span>
                <span
                  className={cn(
                    "mt-1 text-[10px] font-medium",
                    count > 0 ? "text-foreground" : "text-muted-foreground/70",
                  )}
                >
                  {count === 0 ? "—" : `${count}`}
                </span>
              </Button>
            );
          })}
        </div>
      ) : null}

      <div>
        {loading ? (
          <div className="space-y-4" aria-busy aria-label="Loading week">
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading your week…
            </div>
            <DaySectionSkeleton />
            <DaySectionSkeleton />
            <DaySectionSkeleton />
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

        {!loading && !error && stats.totalClasses === 0 ? (
          <div className="flex flex-col items-center justify-center rounded border border-border bg-muted/30 px-6 py-14 text-center">
            <CalendarDays className="size-10 text-secondary-foreground/80" aria-hidden />
            <p className="mt-4 font-medium text-foreground">Nothing scheduled this week</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Use the calendar to add classes, or jump to another week with the arrows above.
            </p>
            <Button
              type="button"
              className="mt-6 rounded bg-primary"
              onClick={() => onWeekStartChange(startOfWeekMonday(new Date()))}
            >
              Back to this week
            </Button>
          </div>
        ) : null}

        {!loading && !error && stats.totalClasses > 0 ? (
          <ul className="space-y-5">
            {days.map((d, dayIndex) => {
              const ymd = formatYmdLocal(d);
              const rows = grouped.get(ymd) ?? [];
              const isToday = ymd === todayYmd;
              const weekdayLong = d.toLocaleDateString(undefined, { weekday: "long" });
              const dateLabel = d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <li
                  key={ymd}
                  id={`week-day-${ymd}`}
                  className="scroll-mt-24 bg-card rounded p-4"
                >
                  <article
                    className={cn(
                      "overflow-hidden rounded border transition-colors ",
                      isToday
                        ? "border-primary/25 bg-[var(--layered-white)] dark:bg-primary/3 shadow-sm"
                        : "border-border/80 bg-muted/15"
                    )}
                  >
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-5">
                      {/* Day label rail */}
                      <div className="flex shrink-0 items-center gap-3 sm:w-36 sm:flex-col sm:items-start sm:gap-2">
                        <div
                          className={cn(
                            "flex size-14 flex-col items-center justify-center rounded border tabular-nums sm:size-16",
                            isToday
                              ? "border-primary/30 bg-[var(--layered-light-blue)] dark:bg-primary text-primary dark:text-primary-foreground"
                              : "border-border/60 bg-background text-foreground"
                          )}
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                            {d.toLocaleDateString(undefined, { weekday: "short" })}
                          </span>
                          <span className="text-2xl font-semibold leading-none">
                            {d.getDate()}
                          </span>
                        </div>
                        <div className="min-w-0 sm:space-y-1">
                          <p className="font-medium text-foreground">{weekdayLong}</p>
                          <p className="text-xs text-muted-foreground">{dateLabel}</p>
                          {isToday ? (
                            <Badge className="mt-1 rounded px-2 text-[10px] uppercase tracking-wide">
                              Today
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      <Separator
                        orientation="vertical"
                        className="hidden sm:block sm:h-auto sm:self-stretch"
                      />

                      {/* Classes */}
                      <div className="min-w-0 flex-1">
                        {rows.length === 0 ? (
                          <div className="flex items-center gap-2 rounded-xl border  border-border/80 bg-[var(--layered-cream)] dark:bg-muted/30 px-4 py-5 text-sm text-muted-foreground">
                            <Clock className="size-4 shrink-0 opacity-60" aria-hidden />
                            No classes scheduled
                          </div>
                        ) : (
                          <ul className="space-y-2">
                            {rows.map((r) => (
                              <li key={r.id}>
                                <WeekClassCard
                                  instance={r}
                                  onSelect={() => onSelectInstance(r.id)}
                                />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </article>
                  {dayIndex < days.length - 1 ? (
                    <Separator className="mt-5 bg-transparent" />
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
