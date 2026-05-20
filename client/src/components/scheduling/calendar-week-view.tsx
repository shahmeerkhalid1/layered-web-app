"use client";

import type { CalendarClassInstance } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  CALENDAR_DAY_START_HOUR,
  formatYmdLocal,
  hourSlots,
  minutesFromDayStart,
  totalCalendarMinutes,
} from "@/lib/calendar-utils";

/** Matches day column `minHeight` in this file — used to map % height → px for layout and radius. */
const CALENDAR_DAY_COLUMN_MIN_HEIGHT_PX = 1200;

/** Floor height so short classes stay readable (may overlap following non-overlapping events slightly). */
const MIN_EVENT_HEIGHT_PX = 36;

const LANE_INSET_PX = 4;
const LANE_GAP_PX = 2;

function instanceDayKey(inst: CalendarClassInstance): string {
  return inst.date.slice(0, 10);
}

export type CalendarEventLayout = {
  top: number;
  heightPct: number;
  col: number;
  cols: number;
};

/**
 * Computes vertical position, minimum display height, horizontal lane for overlapping events,
 * and lane count from max concurrency during each event's span.
 */
function layoutDayInstances(
  day: Date,
  instances: CalendarClassInstance[],
  totalMin: number
): Map<string, CalendarEventLayout> {
  type Node = { id: string; inst: CalendarClassInstance; start: number; end: number };
  const nodes: Node[] = instances.map((inst) => {
    const rawStart = minutesFromDayStart(day, new Date(inst.time));
    const dur = inst.class.durationMinutes ?? 60;
    const start = Math.max(0, Math.min(rawStart, totalMin - 1));
    const end = Math.min(Math.max(start + dur, start + 1), totalMin);
    return { id: inst.id, inst, start, end };
  });
  nodes.sort((a, b) => a.start - b.start || a.end - b.end);

  const colEnds: number[] = [];
  const greedyCol = new Map<string, number>();
  for (const n of nodes) {
    let c = 0;
    while (c < colEnds.length && colEnds[c] > n.start) c++;
    if (c === colEnds.length) colEnds.push(n.end);
    else colEnds[c] = Math.max(colEnds[c], n.end);
    greedyCol.set(n.id, c);
  }

  const minHPct = (MIN_EVENT_HEIGHT_PX / CALENDAR_DAY_COLUMN_MIN_HEIGHT_PX) * 100;
  const out = new Map<string, CalendarEventLayout>();

  for (const n of nodes) {
    const overlaps = nodes.filter((o) => o.start < n.end && o.end > n.start);
    const bounds = new Set<number>([n.start, n.end]);
    for (const o of overlaps) {
      bounds.add(Math.max(o.start, n.start));
      bounds.add(Math.min(o.end, n.end));
    }
    const pts = [...bounds].filter((t) => t >= n.start && t < n.end).sort((a, b) => a - b);
    if (pts.length === 0) pts.push(n.start);
    let maxConcurrent = 1;
    for (const t of pts) {
      const cnt = overlaps.filter((o) => o.start <= t && t < o.end).length;
      maxConcurrent = Math.max(maxConcurrent, cnt);
    }

    const col = greedyCol.get(n.id)!;
    const cols = Math.max(maxConcurrent, col + 1, 1);

    const top = (n.start / totalMin) * 100;
    const durMin = n.inst.class.durationMinutes ?? 60;
    const rawH = Math.max((durMin / totalMin) * 100, minHPct);
    const heightPct = Math.min(rawH, 100 - top);
    out.set(n.id, { top, heightPct, col, cols });
  }

  return out;
}

export interface CalendarEventBlockProps {
  instance: CalendarClassInstance;
  onSelect: (id: string) => void;
  layout: CalendarEventLayout;
}

export function CalendarEventBlock({ instance, onSelect, layout }: CalendarEventBlockProps) {
  const start = new Date(instance.time);
  const durationMin = instance.class.durationMinutes ?? 60;
  const { top, heightPct, col, cols } = layout;

  const approxHeightPx = (heightPct / 100) * CALENDAR_DAY_COLUMN_MIN_HEIGHT_PX;
  const borderRadiusPx = Math.min(Math.max(approxHeightPx * 0.22, 3), 12);

  const veryTight = approxHeightPx < 42;
  const compact = approxHeightPx < 60 || cols > 1;

  const label = instance.class.title;
  const isGroup = instance.class.type === "GROUP";
  const timeStr = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const title = `${label} — ${timeStr}, ${durationMin} min · ${instance.class.type}`;

  const seg =
    cols > 1
      ? `((100% - ${LANE_INSET_PX * 2}px - ${LANE_GAP_PX * (cols - 1)}px) / ${cols})`
      : "";

  const positionStyle: React.CSSProperties =
    cols <= 1
      ? {
          top: `${top}%`,
          height: `${heightPct}%`,
          left: LANE_INSET_PX,
          right: LANE_INSET_PX,
          width: "auto",
          borderRadius: `${borderRadiusPx}px`,
        }
      : {
          top: `${top}%`,
          height: `${heightPct}%`,
          left: `calc(${LANE_INSET_PX}px + ${col} * (${seg} + ${LANE_GAP_PX}px))`,
          width: `calc(${seg})`,
          right: "auto",
          borderRadius: `${borderRadiusPx}px`,
        };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(instance.id);
      }}
      className={cn(
        "absolute z-10 overflow-hidden border text-left font-medium shadow-sm transition hover:z-20 hover:ring-2 hover:ring-ring",
        veryTight ? "flex items-center px-1 py-0.5" : compact ? "flex min-h-0 flex-col justify-start gap-0.5 px-1 py-0.5" : "flex min-h-0 flex-col gap-0.5 px-1.5 py-1 text-[11px]",
        isGroup
          ? "border-primary/30 bg-primary/15 text-primary"
          : "border-secondary/40 bg-secondary/20 text-secondary-foreground"
      )}
      style={positionStyle}
    >
      {veryTight ? (
        <span className="min-w-0 truncate text-[10px] leading-tight">
          {timeStr} · {label}
        </span>
      ) : compact ? (
        <>
          <span className="line-clamp-1 min-w-0 text-[10px] leading-tight font-medium">{label}</span>
          <span className="line-clamp-1 min-w-0 text-[9px] leading-tight opacity-80 tabular-nums">
            {timeStr} · {durationMin}m
          </span>
        </>
      ) : (
        <>
          <span className="line-clamp-2 min-w-0 leading-snug">{label}</span>
          <span className="mt-0.5 block shrink-0 text-[10px] opacity-80 tabular-nums leading-tight">
            {timeStr} · {durationMin}m
          </span>
        </>
      )}
    </button>
  );
}

export interface CalendarWeekViewProps {
  weekStartMonday: Date;
  instances: CalendarClassInstance[];
  onSelectInstance: (id: string) => void;
  onSelectSlot: (day: Date, hour: number) => void;
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function CalendarWeekView({
  weekStartMonday,
  instances,
  onSelectInstance,
  onSelectSlot,
}: CalendarWeekViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartMonday);
    d.setDate(weekStartMonday.getDate() + i);
    return startOfLocalDay(d);
  });

  const hours = hourSlots();
  const total = totalCalendarMinutes();

  const instancesByDay = new Map<string, CalendarClassInstance[]>();
  for (const inst of instances) {
    const key = instanceDayKey(inst);
    const arr = instancesByDay.get(key) ?? [];
    arr.push(inst);
    instancesByDay.set(key, arr);
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <div className="grid min-w-[760px] grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
        <div className="border-b border-border bg-muted/30 p-2" />
        {days.map((d) => (
          <div
            key={formatYmdLocal(d)}
            className="border-b border-l border-border bg-muted/20 p-2 text-center"
          >
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {d.toLocaleDateString(undefined, { weekday: "short" })}
            </p>
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {d.getMonth() + 1}/{d.getDate()}
            </p>
          </div>
        ))}

        <div className="relative border-r border-border bg-muted/10">
          {hours.map((h) => {
            const top = ((h - CALENDAR_DAY_START_HOUR) * 60) / total;
            return (
              <div
                key={h}
                className="absolute right-1 left-0 text-right text-[10px] text-muted-foreground tabular-nums"
                style={{ top: `${top * 100}%` }}
              >
                {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
              </div>
            );
          })}
        </div>

        {days.map((d) => {
          const ymd = formatYmdLocal(d);
          const dayInstances = instancesByDay.get(ymd) ?? [];
          const layout = layoutDayInstances(d, dayInstances, total);
          return (
            <div
              key={ymd}
              className="relative border-l border-border bg-background/30"
              style={{ minHeight: `${CALENDAR_DAY_COLUMN_MIN_HEIGHT_PX}px` }}
            >
              {hours.map((h) => {
                const top = ((h - CALENDAR_DAY_START_HOUR) * 60) / total;
                return (
                  <button
                    key={h}
                    type="button"
                    aria-label={`Schedule at ${h}:00 on ${ymd}`}
                    className="absolute right-0 left-0 border-t border-border/40 hover:bg-muted/15"
                    style={{ top: `${top * 100}%`, height: `${(60 / total) * 100}%` }}
                    onClick={() => onSelectSlot(d, h)}
                  />
                );
              })}
              {dayInstances.map((inst) => {
                const L = layout.get(inst.id);
                if (!L) return null;
                return (
                  <CalendarEventBlock
                    key={inst.id}
                    instance={inst}
                    onSelect={onSelectInstance}
                    layout={L}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
