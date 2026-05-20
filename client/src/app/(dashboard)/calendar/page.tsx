"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarHeader, type CalendarViewMode } from "@/components/scheduling/calendar-header";
import { CalendarMonthView } from "@/components/scheduling/calendar-month-view";
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
        onUpdated={() => void refresh()}
      />

      <div className="rounded-3xl border border-border bg-card p-4 shadow-lg md:p-6">
        <CalendarHeader
          mode={mode}
          onModeChange={setMode}
          title={title}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
          onNewClass={() => setCreateOpen(true)}
        />
        {loading && <p className="mt-4 text-sm text-muted-foreground">Loading calendar…</p>}
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        {!loading && !error && mode === "week" && (
          <div className="mt-6">
            <CalendarWeekView
              weekStartMonday={weekStart}
              instances={data}
              onSelectInstance={openInstance}
              onSelectSlot={onSelectSlot}
            />
          </div>
        )}
        {!loading && !error && mode === "month" && (
          <div className="mt-6">
            <CalendarMonthView
              anchor={cursor}
              instances={data}
              onSelectDay={(d) => {
                setCursor(d);
                setMode("week");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
