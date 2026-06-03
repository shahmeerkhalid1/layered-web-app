"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarRange, ClipboardList, ListFilter, X } from "lucide-react";
import { ExercisePreText } from "@/components/exercises/exercise-pre-text";
import { ExerciseLibraryPagination } from "@/components/exercises/exercise-library-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { formatYmdLabel } from "@/lib/date-ymd";
import { useClientTimeline } from "@/hooks/clients/use-client-timeline";
import { cn } from "@/lib/utils";

interface ClientSessionTimelineProps {
  clientId: string;
}

function formatSessionDate(dateStr: string, timeStr: string): string {
  const d = new Date(dateStr.slice(0, 10) + "T12:00:00");
  const datePart = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = new Date(timeStr).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

export function ClientSessionTimeline({ clientId }: ClientSessionTimelineProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const { items, loading, page, setPage, listTotalCount, totalPages } =
    useClientTimeline({ clientId, startDate, endDate });

  const total = listTotalCount ?? 0;

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasDateFilter = Boolean(startDate || endDate);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (startDate) n += 1;
    if (endDate) n += 1;
    return n;
  }, [startDate, endDate]);

  const datePickerTriggerClass =
    "h-11 w-full min-w-0 rounded-2xl border-input bg-background/80 px-3 shadow-none focus-visible:ring-ring/35";

  function clearDateFilters() {
    setStartDate("");
    setEndDate("");
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ClipboardList className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-heading text-lg font-semibold tracking-[-0.02em]">
            Session history
          </h3>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {loading && listTotalCount === undefined ? (
              <span>Loading notes…</span>
            ) : hasDateFilter ? (
              <>
                <span className="font-medium text-foreground">
                  {total} session note{total === 1 ? "" : "s"} in range
                </span>
                <span className="text-muted-foreground/50" aria-hidden>
                  {" "}
                  ·{" "}
                </span>
                <span>Filtered by class date</span>
              </>
            ) : (
              <span>
                {total} session note{total === 1 ? "" : "s"} recorded
              </span>
            )}
          </p>
        </div>
      </div>

      <div
        className="mt-5 border-t border-border pt-5"
        role="search"
        aria-label="Filter session history"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <ListFilter className="size-4 text-muted-foreground" aria-hidden />
            <span>Filters</span>
            {hasDateFilter ? (
              <span
                className="inline-flex min-w-5 justify-center rounded-full bg-primary/15 px-1.5 text-xs font-medium tabular-nums text-primary"
                aria-label={`${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`}
              >
                {activeFilterCount}
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-9 rounded-full px-4"
            disabled={!hasDateFilter}
            onClick={clearDateFilters}
          >
            Clear filters
          </Button>
        </div>

        <div className="mt-4 rounded-2xl border border-border/80 bg-muted/15 p-4 sm:p-5">
          <div className="flex items-start gap-2">
            <CalendarRange
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium text-foreground">Class date range</p>
              <p className="text-xs text-muted-foreground">
                Show notes only for sessions scheduled between these dates.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="timeline-from" className="text-xs text-muted-foreground">
                From
              </Label>
              <DatePicker
                id="timeline-from"
                value={startDate}
                onChange={setStartDate}
                placeholder="Any start date"
                popoverSide="top"
                lockPopoverSide
                className={datePickerTriggerClass}
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="timeline-to" className="text-xs text-muted-foreground">
                To
              </Label>
              <DatePicker
                id="timeline-to"
                value={endDate}
                onChange={setEndDate}
                minDate={startDate || undefined}
                placeholder="Any end date"
                popoverSide="top"
                lockPopoverSide
                className={datePickerTriggerClass}
              />
            </div>
          </div>

          {hasDateFilter ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
              <span className="text-xs font-medium text-muted-foreground">Active:</span>
              {startDate ? (
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs font-normal"
                >
                  From {formatYmdLabel(startDate, startDate)}
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    aria-label="Remove start date filter"
                    onClick={() => setStartDate("")}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </Badge>
              ) : null}
              {endDate ? (
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs font-normal"
                >
                  To {formatYmdLabel(endDate, endDate)}
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    aria-label="Remove end date filter"
                    onClick={() => setEndDate("")}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="mt-5 flex justify-center py-8">
          <div
            className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-label="Loading session history"
          />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border/80 bg-muted/15 px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            {hasDateFilter ? "No notes match these filters" : "No session notes yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasDateFilter
              ? "Try a wider date range or clear filters to see all session history."
              : "Notes will appear here after you log them from the calendar class drawer."}
          </p>
          {hasDateFilter ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 rounded-full"
              onClick={clearDateFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <ul className={cn("space-y-3", hasDateFilter ? "mt-4" : "mt-5")}>
            {items.map((item) => {
              const inst = item.classInstance;
              const cls = inst.class;
              const expanded = expandedIds.has(item.id);
              const fullContent = item.content.trim();
              const isLong = fullContent.length > 200;
              const displayContent =
                isLong && !expanded ? `${fullContent.slice(0, 200)}…` : fullContent;

              return (
                <li
                  key={item.id}
                  className="rounded-2xl border border-border bg-muted/10 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {cls.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatSessionDate(inst.date, inst.time)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        {cls.type}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {inst.status}
                      </Badge>
                    </div>
                  </div>

                  {fullContent ? (
                    <div className="mt-3">
                      <ExercisePreText className="text-sm text-muted-foreground">
                        {displayContent}
                      </ExercisePreText>
                      {isLong ? (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="mt-1 h-auto p-0 text-xs"
                          onClick={() => toggleExpanded(item.id)}
                        >
                          {expanded ? "Show less" : "Show more"}
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm italic text-muted-foreground">
                      No written note — exercises only.
                    </p>
                  )}

                  {item.exercises.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.exercises.map((row) => (
                        <Link
                          key={row.id}
                          href={`/exercises/${row.exercise.id}`}
                          className="focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-full"
                        >
                          <Badge
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                          >
                            {row.exercise.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className="mt-4">
            <ExerciseLibraryPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              loading={loading}
              ariaLabel="Session history pagination"
            />
          </div>
        </>
      )}
    </section>
  );
}
