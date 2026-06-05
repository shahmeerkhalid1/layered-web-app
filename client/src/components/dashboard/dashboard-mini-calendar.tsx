"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";

import {
  addDays,
  formatYmdLocal,
  startOfMonth,
  startOfWeekMonday,
} from "@/lib/calendar-utils";
import type { CalendarClassInstance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { schedulingApi } from "@/services/scheduling-api";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function instanceYmd(inst: CalendarClassInstance): string {
  return inst.date.slice(0, 10);
}

export function DashboardMiniCalendar() {
  const [instances, setInstances] = useState<CalendarClassInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const anchor = useMemo(() => new Date(), []);
  const todayYmd = formatYmdLocal(anchor);
  const monthLabel = anchor.toLocaleString(undefined, { month: "long", year: "numeric" });

  const gridStart = useMemo(() => startOfWeekMonday(startOfMonth(anchor)), [anchor]);
  const gridDays = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart]);

  const range = useMemo(() => {
    const start = formatYmdLocal(gridStart);
    const end = formatYmdLocal(addDays(gridStart, 41));
    return { start, end };
  }, [gridStart]);

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const rows = await schedulingApi.listClassInstances(range.start, range.end);
          if (!cancelled) setInstances(rows);
        } catch {
          if (!cancelled) setInstances([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [range.start, range.end]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarClassInstance[]>();
    for (const inst of instances) {
      const ymd = instanceYmd(inst);
      const list = map.get(ymd) ?? [];
      list.push(inst);
      map.set(ymd, list);
    }
    return map;
  }, [instances]);

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Teaching days
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {monthLabel}
          </p>
        </div>
        <Link
          href="/calendar"
          className="text-xs font-medium text-primary hover:underline"
        >
          Open calendar
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {gridDays.map((day) => {
          const ymd = formatYmdLocal(day);
          const inMonth = day.getMonth() === anchor.getMonth();
          const isToday = ymd === todayYmd;
          const dayInstances = byDay.get(ymd) ?? [];
          const hasScheduled = dayInstances.some((i) => i.status === "SCHEDULED");
          const hasCompleted = dayInstances.some((i) => i.status === "COMPLETED");

          return (
            <Link
              key={ymd}
              href="/calendar"
              className={cn(
                "flex min-h-9 flex-col items-center justify-center rounded-lg text-xs transition-colors",
                "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                !inMonth && "text-muted-foreground/40",
                isToday && "bg-primary/15 font-semibold text-primary"
              )}
              aria-label={`${ymd}${dayInstances.length ? `, ${dayInstances.length} classes` : ""}`}
            >
              <span>{day.getDate()}</span>
              {dayInstances.length > 0 ? (
                <span className="mt-0.5 flex gap-0.5">
                  {hasScheduled ? (
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                  ) : null}
                  {hasCompleted && !hasScheduled ? (
                    <span className="size-1.5 rounded-full bg-muted-foreground/50" aria-hidden />
                  ) : null}
                  {hasCompleted && hasScheduled ? (
                    <span className="size-1.5 rounded-full bg-muted-foreground/50" aria-hidden />
                  ) : null}
                </span>
              ) : loading ? (
                <span className="mt-0.5 size-1.5 rounded-full bg-muted/60" aria-hidden />
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" aria-hidden />
          Scheduled
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/50" aria-hidden />
          Completed
        </span>
        <Calendar className="ml-auto size-3.5 opacity-60" aria-hidden />
      </div>
    </div>
  );
}
