"use client";

import type { CalendarClassInstance } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  addDays,
  formatYmdLocal,
  isSameLocalDay,
  startOfMonth,
  startOfWeekMonday,
} from "@/lib/calendar-utils";

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

  const counts = new Map<string, number>();
  for (const inst of instances) {
    const k = instanceDayKey(inst);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const inMonth = (d: Date) => d.getMonth() === anchor.getMonth();

  return (
    <div className="rounded-lg border border-border bg-card p-3  md:p-4">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const ymd = formatYmdLocal(d);
          const n = counts.get(ymd) ?? 0;
          return (
            <button
              key={ymd}
              type="button"
              onClick={() => onSelectDay(d)}
              className={cn(
                "flex min-h-14 flex-col items-center justify-start rounded-2xl border border-transparent px-1 py-2 text-sm transition hover:border-border hover:bg-muted/30",
                !inMonth(d) && "opacity-40",
                isSameLocalDay(d, new Date()) && "ring-1 ring-ring"
              )}
            >
              <span className="tabular-nums font-semibold">{d.getDate()}</span>
              {n > 0 && (
                <span className="mt-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary tabular-nums">
                  {n} class{n === 1 ? "" : "es"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
