"use client";

import { useMemo } from "react";
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
  calendarDayColumnHeightPx,
  computeCalendarHourRange,
  formatCalendarEventTimeRange,
  formatCalendarHourLabel,
  formatYmdLocal,
  hourSlots,
  instanceLocalDayKey,
  isPastCalendarHourSlot,
  isSameLocalDay,
  minutesFromGridStart,
  totalCalendarMinutes,
} from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

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
  totalMin: number,
  gridStartHour: number,
  columnHeightPx: number
): Map<string, CalendarEventLayout> {
  type Node = { id: string; inst: CalendarClassInstance; start: number; end: number };
  const nodes: Node[] = instances.map((inst) => {
    const rawStart = minutesFromGridStart(day, new Date(inst.time), gridStartHour);
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

  const minHPct = (MIN_EVENT_HEIGHT_PX / columnHeightPx) * 100;
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
  columnHeightPx: number;
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
              "inline-flex h-5 items-center rounded px-2 text-[10px] font-semibold uppercase tracking-wide",
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
            "inline-flex h-5 items-center rounded px-2 text-[10px] font-semibold uppercase tracking-wide",
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

export function CalendarEventBlock({ instance, onSelect, layout, columnHeightPx }: CalendarEventBlockProps) {
  const start = new Date(instance.time);
  const durationMin = instance.class.durationMinutes ?? 60;
  const { top, heightPct, col, cols } = layout;

  const approxHeightPx = (heightPct / 100) * columnHeightPx;
  const borderRadiusPx = Math.min(Math.max(approxHeightPx * 0.22, 3), 12);

  const veryTight = approxHeightPx < 42;
  const compact = approxHeightPx < 60 || cols > 1;

  const label = instance.class.title;
  const isGroup = instance.class.type === "GROUP";
  const displayTitle = isGroup ? label : `Private: ${label}`;
  const statusLabel = instanceStatusLabel(instance.status);
  const timeStr = formatCalendarEventTimeRange(start, durationMin);
  const isScheduled = instance.status === "SCHEDULED";
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
          // borderRadius: `${borderRadiusPx}px`,
        }
      : {
          top: `${top}%`,
          height: `${heightPct}%`,
          left: `calc(${LANE_INSET_PX}px + ${col} * (${seg} + ${LANE_GAP_PX}px))`,
          width: `calc(${seg})`,
          right: "auto",
          // borderRadius: `${borderRadiusPx}px`,
        };

  const blockClassName = cn(
    "absolute z-10 cursor-pointer overflow-hidden border-0 text-left transition-colors duration-150 ease-out",
    "hover:z-20 focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
    veryTight
      ? "flex items-center gap-1 px-2 py-0.5"
      : compact
        ? "flex min-h-0 flex-col justify-start gap-0 px-2 py-1"
        : "flex min-h-0 flex-col gap-0 px-2.5 py-1.5",
    weekGridEventStatusClasses(instance.status, isGroup)
  );

  const titleClassName =
    instance.status === "CANCELLED"
      ? "line-through decoration-destructive decoration-[1.8px]"
      : instance.status === "COMPLETED"
        ? "opacity-85"
        : undefined;

  const timeClassName = cn(
    "line-clamp-1 min-w-0 tabular-nums leading-tight font-normal",
    veryTight ? "text-[10px]" : "text-[11px]",
    isScheduled ? "text-white/70" : "opacity-80",
  );

  const blockContent = veryTight ? (
    <span className={cn("min-w-0 truncate text-[10px] leading-tight font-semibold", titleClassName)}>
      {displayTitle}
      <span className={isScheduled ? "text-white/50" : "opacity-50"}> · </span>
      <span className={cn("tabular-nums", isScheduled ? "text-white/70 font-normal" : "opacity-80")}>
        {timeStr}
      </span>
    </span>
  ) : compact ? (
    <>
      <span
        className={cn(
          "line-clamp-1 min-w-0 text-xs leading-tight font-semibold ",
          isScheduled && "text-white",
          titleClassName,
        )}
      >
        {displayTitle}
      </span>
      <span className={timeClassName}>{timeStr}</span>
    </>
  ) : (
    <>
      <span
        className={cn(
          "line-clamp-2 min-w-0 text-xs font-semibold leading-snug",
          isScheduled && "text-white",
          titleClassName,
        )}
      >
        {displayTitle}
      </span>
      <span className={cn("mt-0.5 block shrink-0", timeClassName)}>{timeStr}</span>
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

  const hourRange = useMemo(() => computeCalendarHourRange(instances), [instances]);
  const hours = useMemo(() => hourSlots(hourRange), [hourRange]);
  const total = useMemo(() => totalCalendarMinutes(hourRange), [hourRange]);
  const columnHeightPx = useMemo(
    () => calendarDayColumnHeightPx(hourRange),
    [hourRange]
  );
  const { startHour: gridStartHour, endHour: gridEndHour } = hourRange;

  const instancesByDay = new Map<string, CalendarClassInstance[]>();
  for (const inst of instances) {
    const key = instanceLocalDayKey(inst);
    const arr = instancesByDay.get(key) ?? [];
    arr.push(inst);
    instancesByDay.set(key, arr);
  }

  const today = new Date();

  return (
    <div className="overflow-x-auto overflow-y-hidden rounded border border-border bg-card">
      <div className="grid min-w-[760px] grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
        <div className="h-14 border-b border-border" />
        {days.map((d) => {
          const isToday = isSameLocalDay(d, today);
          return (
            <div
              key={formatYmdLocal(d)}
              className={cn(
                "flex h-14 flex-col items-center justify-center border-b border-border text-center",
                isToday && "bg-[var(--layered-light-blue)]",
              )}
            >
              <p
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wide",
                  isToday ? "text-[var(--layered-navy)]" : "text-muted-foreground",
                )}
              >
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </p>
              <p
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  isToday
                    ? "rounded bg-[var(--layered-navy)]/15 px-2 text-[var(--layered-navy)]"
                    : "text-foreground",
                )}
              >
                {d.getDate()}
              </p>
            </div>
          );
        })}

        <div
          className="relative border-r border-border"
          style={{ height: `${columnHeightPx}px` }}
        >
          {hours.map((h) => {
            const top = ((h - gridStartHour) * 60) / total;
            const isFirst = h === gridStartHour;
            const isLast = h === gridEndHour;
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
          const layout = layoutDayInstances(d, dayInstances, total, gridStartHour, columnHeightPx);
          return (
            <div
              key={ymd}
              className={cn(
                "relative border-l border-border",
              )}
              style={{ height: `${columnHeightPx}px` }}
            >
              {hours.map((h) => {
                const top = ((h - gridStartHour) * 60) / total;
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
                      "absolute right-0 left-0 transition-colors duration-150 px-1",
                      isPastSlot
                        ? "cursor-default opacity-40"
                        : "cursor-pointer hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
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
                    columnHeightPx={columnHeightPx}
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
