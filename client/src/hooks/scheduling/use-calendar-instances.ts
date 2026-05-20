"use client";

import { useCallback, useEffect, useState } from "react";
import type { CalendarClassInstance } from "@/lib/types";
import { schedulingApi } from "@/services/scheduling-api";

export function useCalendarInstances(start: string, end: string) {
  const [data, setData] = useState<CalendarClassInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await schedulingApi.listClassInstances(start, end, signal);
      setData(rows);
    } catch {
      if (signal?.aborted) return;
      setError("Could not load calendar.");
      setData([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  return { data, loading, error, refresh: load };
}
