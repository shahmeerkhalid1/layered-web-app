"use client";

import { useMemo, useState } from "react";
import { ClassInstanceDrawer } from "@/components/scheduling/class-instance-drawer";
import { useCalendarInstances } from "@/hooks/scheduling/use-calendar-instances";
import type { CalendarClassInstance } from "@/lib/types";
import {
  addDays,
  formatYmdLocal,
  startOfWeekMonday,
} from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

export default function WeekOverviewPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const range = useMemo(
    () => ({
      start: formatYmdLocal(weekStart),
      end: formatYmdLocal(addDays(weekStart, 6)),
    }),
    [weekStart]
  );

  const { data, loading, error, refresh } = useCalendarInstances(range.start, range.end);

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarClassInstance[]>();
    for (const row of data) {
      const k = row.date.slice(0, 10);
      const arr = map.get(k) ?? [];
      arr.push(row);
      map.set(k, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    }
    return map;
  }, [data]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  return (
    <div className="space-y-6">
      <ClassInstanceDrawer
        instanceId={drawerId}
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o);
          if (!o) setDrawerId(null);
        }}
        onInstanceIdChange={setDrawerId}
        onUpdated={() => void refresh()}
      />

      <div className="rounded-3xl border border-border bg-card p-4 shadow-lg md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground md:text-2xl">
              Week overview
            </h1>
            <p className="text-sm text-muted-foreground">
              {weekStart.toLocaleDateString(undefined, { month: "long", day: "numeric" })} –{" "}
              {addDays(weekStart, 6).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
              onClick={() => setWeekStart((d) => addDays(d, -7))}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
              onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
            >
              This week
            </button>
            <button
              type="button"
              className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
              onClick={() => setWeekStart((d) => addDays(d, 7))}
            >
              Next
            </button>
          </div>
        </div>

        {loading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <ul className="mt-6 space-y-8">
            {days.map((d) => {
              const ymd = formatYmdLocal(d);
              const rows = grouped.get(ymd) ?? [];
              return (
                <li key={ymd}>
                  <p className="text-sm font-semibold text-foreground">
                    {d.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  {rows.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No classes scheduled.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {rows.map((r) => {
                        const typeStyle = [r.classType, r.classStyle].filter(Boolean).join(" · ");
                        return (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setDrawerId(r.id);
                              setDrawerOpen(true);
                            }}
                            className={cn(
                              "flex w-full max-w-xl flex-col gap-0.5 rounded-2xl border border-border px-4 py-3 text-left text-sm transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between",
                              r.class.type === "GROUP"
                                ? "border-primary/25 bg-primary/5"
                                : "border-secondary/30 bg-secondary/10"
                            )}
                          >
                            <span className="font-medium text-foreground">{r.class.title}</span>
                            <span className="tabular-nums text-muted-foreground">
                              {new Date(r.time).toLocaleTimeString(undefined, {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}{" "}
                              · {r.class.type} · {r.class.durationMinutes ?? 60}m
                              {typeStyle ? ` · ${typeStyle}` : ""}
                            </span>
                          </button>
                        </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
