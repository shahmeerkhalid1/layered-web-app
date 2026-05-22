"use client";

import { useMemo, useState } from "react";
import { ClassInstanceDrawer } from "@/components/scheduling/class-instance-drawer";
import { WeekOverviewPanel } from "@/components/scheduling/week-overview-panel";
import { useCalendarInstances } from "@/hooks/scheduling/use-calendar-instances";
import type { CalendarClassInstance } from "@/lib/types";
import {
  addDays,
  formatYmdLocal,
  startOfWeekMonday,
} from "@/lib/calendar-utils";

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

      <WeekOverviewPanel
        weekStart={weekStart}
        onWeekStartChange={setWeekStart}
        days={days}
        grouped={grouped}
        loading={loading}
        error={error}
        onSelectInstance={(id) => {
          setDrawerId(id);
          setDrawerOpen(true);
        }}
      />
    </div>
  );
}
