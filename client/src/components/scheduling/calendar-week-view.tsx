"use client";

import { Clock } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CalendarClassInstance } from "@/lib/types";
import {
  instanceStatusLabel,
  weekGridEventStatusClasses,
} from "@/lib/calendar-instance-status-styles";
import {
  CALENDAR_DAY_END_HOUR,
  CALENDAR_DAY_START_HOUR,
  calendarDayColumnHeightPx,
  formatCalendarHourLabel,
  formatYmdLocal,
  hourSlots,
  instanceLocalDayKey,
  isPastCalendarHourSlot,
  isSameLocalDay,
  minutesFromDayStart,
  totalCalendarMinutes,
} from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

/** Matches day column `height` — used to map % height → px for layout and radius. */
const CALENDAR_DAY_COLUMN_HEIGHT_PX = calendarDayColumnHeightPx();

/** Floor height so short classes stay readable (may overlap following non-overlapping events slightly). */
const MIN_EVENT_HEIGHT_PX = 36;

const LANE_INSET_PX = 4;
const LANE_GAP_PX = 2;

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

  const minHPct = (MIN_EVENT_HEIGHT_PX / CALENDAR_DAY_COLUMN_HEIGHT_PX) * 100;
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

function CalendarEventTooltipContent({
  instance,
  timeStr,
  durationMin,
  typeStyle,
}: {
  instance: CalendarClassInstance;
  timeStr: string;
  durationMin: number;
  typeStyle: string;
}) {
  const isGroup = instance.class.type === "GROUP";
  const statusLabel = instanceStatusLabel(instance.status);

  return (
    <div className="space-y-2 text-left">
      <p className="font-semibold leading-snug text-background">{instance.class.title}</p>
      <div className="flex items-center gap-1.5 text-xs text-background/85">
        <Clock className="size-3.5 shrink-0" aria-hidden />
        <span className="tabular-nums">
          {timeStr}
          <span className="text-background/50"> · </span>
          {durationMin} min
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {statusLabel ? (
          <span
            className={cn(
              "inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold uppercase tracking-wide",
              instance.status === "CANCELLED"
                ? "bg-destructive/25 text-background"
                : "bg-background/25 text-background/90"
            )}
          >
            {statusLabel}
          </span>
        ) : null}
        <span
          className={cn(
            "inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold uppercase tracking-wide",
            isGroup ? "bg-background/20 text-background" : "bg-background/15 text-background/90"
          )}
        >
          {instance.class.type}
        </span>
        {typeStyle ? (
          <span className="text-xs text-background/75">{typeStyle}</span>
        ) : null}
      </div>
      <p className="text-[10px] text-background/60">Click for details</p>
    </div>
  );
}

export function CalendarEventBlock({ instance, onSelect, layout }: CalendarEventBlockProps) {
  const start = new Date(instance.time);
  const durationMin = instance.class.durationMinutes ?? 60;
  const { top, heightPct, col, cols } = layout;

  const approxHeightPx = (heightPct / 100) * CALENDAR_DAY_COLUMN_HEIGHT_PX;
  const borderRadiusPx = Math.min(Math.max(approxHeightPx * 0.22, 3), 12);

  const veryTight = approxHeightPx < 42;
  const compact = approxHeightPx < 60 || cols > 1;

  const label = instance.class.title;
  const isGroup = instance.class.type === "GROUP";
  const statusLabel = instanceStatusLabel(instance.status);
  const timeStr = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  const typeStyle = [instance.classType, instance.classStyle].filter(Boolean).join(" · ");
  const ariaLabel = [
    label,
    timeStr,
    `${durationMin} minutes`,
    instance.class.type,
    statusLabel,
    typeStyle,
  ]
    .filter(Boolean)
    .join(", ");

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

  const blockClassName = cn(
    "absolute z-10 cursor-pointer overflow-hidden border-y border-r text-left font-medium shadow-sm transition-all",
    "border-l-[3px] hover:z-20 hover:-translate-y-px hover:shadow-md hover:ring-3 hover:ring-ring/40",
    "focus-visible:z-20 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    veryTight
      ? "flex items-center gap-1 px-1.5 py-0.5"
      : compact
        ? "flex min-h-0 flex-col justify-start gap-0.5 px-1.5 py-0.5"
        : "flex min-h-0 flex-col gap-0.5 px-2 py-1 text-[11px]",
    weekGridEventStatusClasses(instance.status, isGroup)
  );

  const titleClassName =
    instance.status === "CANCELLED"
      ? "line-through decoration-destructive/50"
      : instance.status === "COMPLETED"
        ? "opacity-85"
        : undefined;

  const blockContent = veryTight ? (
    <span className={cn("min-w-0 truncate text-[10px] leading-tight font-medium", titleClassName)}>
      <span className="tabular-nums opacity-90">{timeStr}</span>
      <span className="opacity-50"> · </span>
      {label}
    </span>
  ) : compact ? (
    <>
      <span className={cn("line-clamp-1 min-w-0 text-[10px] leading-tight font-semibold", titleClassName)}>
        {label}
      </span>
      {typeStyle ? (
        <span className="line-clamp-1 min-w-0 text-[9px] leading-tight opacity-75">{typeStyle}</span>
      ) : null}
      <span className="line-clamp-1 min-w-0 text-[9px] leading-tight opacity-80 tabular-nums">
        {timeStr} · {durationMin}m
      </span>
    </>
  ) : (
    <>
      <span className={cn("line-clamp-2 min-w-0 font-semibold leading-snug", titleClassName)}>{label}</span>
      {typeStyle ? (
        <span className="line-clamp-1 min-w-0 text-[10px] leading-tight opacity-75">{typeStyle}</span>
      ) : null}
      <span className="mt-0.5 block shrink-0 text-[10px] tabular-nums leading-tight opacity-80">
        {timeStr} · {durationMin}m
      </span>
    </>
  );

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={ariaLabel}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(instance.id);
            }}
            className={blockClassName}
            style={positionStyle}
          >
            {blockContent}
          </button>
        }
      />
      <TooltipContent side="top" sideOffset={8} className="max-w-64 px-3 py-2.5">
        <CalendarEventTooltipContent
          instance={instance}
          timeStr={timeStr}
          durationMin={durationMin}
          typeStyle={typeStyle}
        />
      </TooltipContent>
    </Tooltip>
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
    const key = instanceLocalDayKey(inst);
    const arr = instancesByDay.get(key) ?? [];
    arr.push(inst);
    instancesByDay.set(key, arr);
  }

  const today = new Date();

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-inner">
      <div className="grid min-w-[760px] grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
        <div className="border-b border-border/70 bg-muted/25 p-2" />
        {days.map((d) => {
          const isToday = isSameLocalDay(d, today);
          return (
            <div
              key={formatYmdLocal(d)}
              className={cn(
                "border-b border-l border-border/70 p-2 text-center",
                isToday ? "bg-primary/10" : "bg-muted/20"
              )}
            >
              <p
                className={cn(
                  "text-[10px] font-semibold tracking-wider uppercase",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}
              >
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </p>
              <p
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  isToday ? "text-primary" : "text-foreground"
                )}
              >
                {d.getDate()}
              </p>
            </div>
          );
        })}

        <div
          className="relative border-r border-border/70 bg-muted/15"
          style={{ height: `${CALENDAR_DAY_COLUMN_HEIGHT_PX}px` }}
        >
          {hours.map((h) => {
            const top = ((h - CALENDAR_DAY_START_HOUR) * 60) / total;
            const isFirst = h === CALENDAR_DAY_START_HOUR;
            const isLast = h === CALENDAR_DAY_END_HOUR;
            return (
              <div
                key={h}
                className="absolute right-1 left-0 text-right text-[10px] leading-none text-muted-foreground tabular-nums"
                style={{
                  top: `${top * 100}%`,
                  transform: isFirst
                    ? "translateY(0)"
                    : isLast
                      ? "translateY(-100%)"
                      : "translateY(-50%)",
                }}
              >
                {formatCalendarHourLabel(h)}
              </div>
            );
          })}
        </div>

        {days.map((d) => {
          const ymd = formatYmdLocal(d);
          const isToday = isSameLocalDay(d, today);
          const dayInstances = instancesByDay.get(ymd) ?? [];
          const layout = layoutDayInstances(d, dayInstances, total);
          return (
            <div
              key={ymd}
              className={cn(
                "relative border-l border-border/70",
                isToday ? "bg-primary/2" : "bg-background/40"
              )}
              style={{ height: `${CALENDAR_DAY_COLUMN_HEIGHT_PX}px` }}
            >
              {hours.map((h) => {
                const top = ((h - CALENDAR_DAY_START_HOUR) * 60) / total;
                const isPastSlot = isPastCalendarHourSlot(d, h);
                return (
                  <button
                    key={h}
                    type="button"
                    disabled={isPastSlot}
                    aria-label={
                      isPastSlot
                        ? `Cannot schedule in the past (${ymd} ${h}:00)`
                        : `Schedule at ${h}:00 on ${ymd}`
                    }
                    className={cn(
                      "absolute right-0 left-0 border-t border-border/35 transition-colors",
                      isPastSlot
                        ? "cursor-default opacity-40"
                        : "cursor-pointer hover:bg-muted/25 hover:ring-1 hover:ring-inset hover:ring-ring/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
                    )}
                    style={{ top: `${top * 100}%`, height: `${(60 / total) * 100}%` }}
                    onClick={isPastSlot ? undefined : () => onSelectSlot(d, h)}
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
