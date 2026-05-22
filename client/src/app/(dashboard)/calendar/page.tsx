"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarMonthView } from "@/components/scheduling/calendar-month-view";
import { CalendarPanel } from "@/components/scheduling/calendar-panel";
import type { CalendarViewMode } from "@/components/scheduling/calendar-header";
import { CalendarWeekView } from "@/components/scheduling/calendar-week-view";
import { ClassInstanceDrawer } from "@/components/scheduling/class-instance-drawer";
import { CreateClassDialog } from "@/components/scheduling/create-class-dialog";
import { QuickScheduleDialog } from "@/components/scheduling/quick-schedule-dialog";
import {
  addDays,
  formatYmdLocal,
  startOfMonth,
  startOfWeekMonday,
} from "@/lib/calendar-utils";
import { useCalendarInstances } from "@/hooks/scheduling/use-calendar-instances";

function isCurrentPeriod(mode: CalendarViewMode, cursor: Date, weekStart: Date): boolean {
  const now = new Date();
  if (mode === "week") {
    return formatYmdLocal(startOfWeekMonday(now)) === formatYmdLocal(weekStart);
  }
  return (
    now.getMonth() === cursor.getMonth() && now.getFullYear() === cursor.getFullYear()
  );
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const [mode, setMode] = useState<CalendarViewMode>("week");
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickSlot, setQuickSlot] = useState<{ date: string; time?: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const weekStart = useMemo(() => startOfWeekMonday(cursor), [cursor]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const monthGridStart = useMemo(() => startOfWeekMonday(startOfMonth(cursor)), [cursor]);
  const monthGridEnd = useMemo(() => addDays(monthGridStart, 41), [monthGridStart]);

  const range = useMemo(() => {
    if (mode === "week") {
      return { start: formatYmdLocal(weekStart), end: formatYmdLocal(weekEnd) };
    }
    return { start: formatYmdLocal(monthGridStart), end: formatYmdLocal(monthGridEnd) };
  }, [mode, weekStart, weekEnd, monthGridStart, monthGridEnd]);

  const { data, loading, error, refresh } = useCalendarInstances(range.start, range.end);

  const title = useMemo(() => {
    if (mode === "week") {
      const a = weekStart;
      const b = weekEnd;
      if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
        return `${a.toLocaleString(undefined, { month: "long" })} ${a.getDate()}–${b.getDate()}, ${a.getFullYear()}`;
      }
      return `${a.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${b.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return cursor.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [mode, weekStart, weekEnd, cursor]);

  const isCurrent = isCurrentPeriod(mode, cursor, weekStart);

  const onPrev = () => {
    if (mode === "week") setCursor((d) => addDays(d, -7));
    else setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const onNext = () => {
    if (mode === "week") setCursor((d) => addDays(d, 7));
    else setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const onToday = () => setCursor(new Date());

  const openInstance = useCallback((id: string) => {
    setDrawerId(id);
    setDrawerOpen(true);
  }, []);

  const onSelectSlot = (day: Date, hour: number) => {
    const ymd = formatYmdLocal(day);
    const hh = String(hour).padStart(2, "0");
    setQuickSlot({ date: ymd, time: `${hh}:00` });
    setQuickOpen(true);
  };

  return (
    <div className="space-y-6">
      <QuickScheduleDialog
        open={quickOpen}
        onOpenChange={(o) => {
          setQuickOpen(o);
          if (!o) setQuickSlot(null);
        }}
        slotPrefill={quickSlot ?? undefined}
        onSuccess={() => void refresh()}
      />
      <CreateClassDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={() => void refresh()} />
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

      <CalendarPanel
        mode={mode}
        onModeChange={setMode}
        title={title}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
        onNewClass={() => setCreateOpen(true)}
        classCount={data.length}
        isCurrentPeriod={isCurrent}
        loading={loading}
        error={error}
      >
        {mode === "week" ? (
          <CalendarWeekView
            weekStartMonday={weekStart}
            instances={data}
            onSelectInstance={openInstance}
            onSelectSlot={onSelectSlot}
          />
        ) : (
          <CalendarMonthView
            anchor={cursor}
            instances={data}
            onSelectDay={(d) => {
              setCursor(d);
              setMode("week");
            }}
          />
        )}
      </CalendarPanel>
    </div>
  );
}
