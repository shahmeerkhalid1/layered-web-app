"use client";

import type { CalendarClassInstance } from "@/lib/types";
import {
  addDays,
  formatYmdLocal,
  instanceLocalDayKey,
  isSameLocalDay,
  startOfMonth,
  startOfWeekMonday,
} from "@/lib/calendar-utils";
import {
  CalendarDayStatusDots,
  CalendarStatusLegend,
} from "@/components/scheduling/calendar-day-status-dots";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CalendarMonthViewProps {
  /** Any date within the month (local). */
  anchor: Date;
  instances: CalendarClassInstance[];
  onSelectDay: (day: Date) => void;
}

export function CalendarMonthView({ anchor, instances, onSelectDay }: CalendarMonthViewProps) {
  const monthStart = startOfMonth(anchor);
  const gridStart = startOfWeekMonday(monthStart);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = new Date();

  const byDay = new Map<string, CalendarClassInstance[]>();
  for (const inst of instances) {
    const k = instanceLocalDayKey(inst);
    const list = byDay.get(k) ?? [];
    list.push(inst);
    byDay.set(k, list);
  }

  const inMonth = (d: Date) => d.getMonth() === anchor.getMonth();

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-inner">
      <div className="grid grid-cols-7 gap-px border-b border-border/70 bg-muted/25 text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-2.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 p-2 md:gap-1.5 md:p-3">
        {cells.map((d) => {
          const ymd = formatYmdLocal(d);
          const dayInstances = byDay.get(ymd) ?? [];
          const isToday = isSameLocalDay(d, today);
          const outside = !inMonth(d);

          return (
            <Button
              key={ymd}
              type="button"
              variant="outline"
              onClick={() => onSelectDay(d)}
              className={cn(
                "h-auto min-h-16 cursor-pointer flex-col gap-1 rounded-2xl px-1 py-2 font-normal shadow-none",
                outside && "opacity-45",
                isToday
                  ? "border-primary/40 bg-primary/10 text-foreground hover:border-primary/50 hover:bg-primary/15"
                  : "bg-background/60 text-muted-foreground hover:text-foreground"
              )}
              aria-label={`${ymd}${dayInstances.length ? `, ${dayInstances.length} classes` : ""}`}
            >
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums leading-none",
                  isToday && "text-primary"
                )}
              >
                {d.getDate()}
              </span>
              <CalendarDayStatusDots instances={dayInstances} className="min-h-[6px]" />
            </Button>
          );
        })}
      </div>
      <div className="border-t border-border/70 bg-muted/15 px-3 py-3 md:px-4">
        <CalendarStatusLegend />
      </div>
    </div>
  );
}
