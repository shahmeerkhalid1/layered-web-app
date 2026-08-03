"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  addDays,
  calendarDayHref,
  formatYmdLocal,
  instanceLocalDayKey,
  startOfMonth,
  startOfWeekMonday,
} from "@/lib/calendar-utils";
import {
  CalendarDayStatusDots,
  CalendarStatusLegend,
} from "@/components/scheduling/calendar-day-status-dots";
import type { CalendarClassInstance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { schedulingApi } from "@/services/scheduling-api";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DashboardMiniCalendar({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const [instances, setInstances] = useState<CalendarClassInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const isDark = variant === "dark";

  const anchor = useMemo(() => new Date(), []);
  const todayYmd = formatYmdLocal(anchor);
  const monthLabel = anchor.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const gridStart = useMemo(
    () => startOfWeekMonday(startOfMonth(anchor)),
    [anchor],
  );
  const gridDays = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );

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
          const rows = await schedulingApi.listClassInstances(
            range.start,
            range.end,
          );
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
      const ymd = instanceLocalDayKey(inst);
      const list = map.get(ymd) ?? [];
      list.push(inst);
      map.set(ymd, list);
    }
    return map;
  }, [instances]);

  return (
    <div
      className={cn(
        "rounded",
        isDark ? "bg-[var(--layered-black)] p-5 text-white" : "border border-border bg-card p-6",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2
            className={cn(
              "text-xl font-semibold",
              isDark ? "text-white" : "text-foreground",
            )}
          >
            Teaching days
          </h2>
          <p
            className={cn(
              "mt-0.5 text-sm",
              isDark ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {monthLabel}
          </p>
        </div>
        <Link
          href="/calendar"
          className={cn(
            "text-xs font-medium transition-colors duration-150",
            isDark
              ? "text-[#7ba3d4] hover:text-[#9bb8e0]"
              : "text-[var(--layered-navy)] hover:underline",
          )}
        >
          Open calendar
        </Link>
      </div>

      <div
        className={cn(
          "grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide",
          isDark ? "mt-3 text-white/50" : "mt-4 text-muted-foreground",
        )}
      >
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
          const hasClasses = dayInstances.length > 0;

          return (
            <Link
              key={ymd}
              href={calendarDayHref(ymd)}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded text-xs transition-colors duration-150",
                isDark ? "min-h-8" : "min-h-9",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                !inMonth &&
                  (isDark ? "text-white/30" : "text-muted-foreground/40"),
                isToday &&
                  (isDark
                    ? "bg-[var(--layered-navy)] font-semibold text-white"
                    : "bg-[var(--layered-navy)]/15 font-semibold text-[var(--layered-navy)]"),
                !isToday && isDark && "hover:bg-white/8",
                !isToday && !isDark && "hover:bg-muted/40",
              )}
              aria-label={`${ymd}${dayInstances.length ? `, ${dayInstances.length} classes` : ""}`}
            >
              <span>{day.getDate()}</span>
              {hasClasses ? (
                <CalendarDayStatusDots
                  instances={dayInstances}
                  variant={isDark ? "dark" : "light"}
                  className="mt-0.5"
                />
              ) : loading ? (
                <span
                  className={cn(
                    "mt-0.5 size-1.5 rounded",
                    isDark ? "bg-white/20" : "bg-muted/60",
                  )}
                  aria-hidden
                />
              ) : null}
            </Link>
          );
        })}
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-3 border-t",
          isDark ? "mt-3 border-white/12 pt-3" : "mt-4 border-border pt-4",
        )}
      >
        <CalendarStatusLegend variant={isDark ? "dark" : "light"} />
      </div>
    </div>
  );
}
