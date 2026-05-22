"use client";

import type { CalendarClassInstance } from "@/lib/types";
import {
  addDays,
  formatYmdLocal,
  isSameLocalDay,
  startOfMonth,
  startOfWeekMonday,
} from "@/lib/calendar-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function instanceDayKey(inst: CalendarClassInstance): string {
  return inst.date.slice(0, 10);
}

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

  const counts = new Map<string, number>();
  for (const inst of instances) {
    const k = instanceDayKey(inst);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const inMonth = (d: Date) => d.getMonth() === anchor.getMonth();

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/10 shadow-inner">
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
          const n = counts.get(ymd) ?? 0;
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
            >
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums leading-none",
                  isToday && "text-primary"
                )}
              >
                {d.getDate()}
              </span>
              {n > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums",
                    isToday
                      ? "bg-primary/20 text-primary"
                      : "bg-primary/15 text-primary"
                  )}
                >
                  {n}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground/50">—</span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
