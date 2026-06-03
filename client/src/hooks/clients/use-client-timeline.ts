"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  sessionNoteApi,
  SESSION_NOTE_TIMELINE_PAGE_SIZE,
} from "@/services/session-note-api";
import type { SessionNoteTimelineItem } from "@/lib/types";

interface UseClientTimelineOptions {
  clientId: string;
  startDate: string;
  endDate: string;
}

export function useClientTimeline({
  clientId,
  startDate,
  endDate,
}: UseClientTimelineOptions) {
  const [items, setItems] = useState<SessionNoteTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [listTotalCount, setListTotalCount] = useState<number | undefined>(
    undefined
  );
  const [pageSize, setPageSize] = useState(SESSION_NOTE_TIMELINE_PAGE_SIZE);
  const [fetchVersion, setFetchVersion] = useState(0);
  const activeRequestRef = useRef<AbortController | null>(null);
  const prevFiltersRef = useRef({ startDate, endDate });
  const fetchWaitersRef = useRef<VoidFunction[]>([]);

  const totalPages = Math.max(
    1,
    listTotalCount !== undefined ? Math.ceil(listTotalCount / pageSize) : 1
  );

  const refreshTimeline = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      fetchWaitersRef.current.push(resolve);
      setFetchVersion((v) => v + 1);
    });
  }, []);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const filterChanged =
      prev.startDate !== startDate || prev.endDate !== endDate;
    prevFiltersRef.current = { startDate, endDate };

    if (filterChanged && page !== 1) {
      setLoading(true);
      setPage(1);
      return;
    }

    let cancelled = false;
    let skipLoadingClear = false;
    const controller = new AbortController();
    activeRequestRef.current?.abort();
    activeRequestRef.current = controller;
    setLoading(true);

    const flushWaiters = () => {
      const waiters = fetchWaitersRef.current.splice(0);
      for (const w of waiters) w();
    };

    void (async () => {
      try {
        const data = await sessionNoteApi.getClientNotes(
          clientId,
          {
            page,
            limit: SESSION_NOTE_TIMELINE_PAGE_SIZE,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          },
          controller.signal
        );
        if (cancelled) return;

        const maxPage = Math.max(1, Math.ceil(data.total / data.limit));
        if (page > maxPage) {
          setPage(maxPage);
          skipLoadingClear = true;
          return;
        }

        setItems(data.data);
        setListTotalCount(data.total);
        setPageSize(data.limit);
      } catch (err) {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          toast.error("Failed to load session history");
        }
      } finally {
        if (!cancelled && !skipLoadingClear) setLoading(false);
        flushWaiters();
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [clientId, page, startDate, endDate, fetchVersion]);

  return {
    items,
    loading,
    refreshTimeline,
    page,
    setPage,
    listTotalCount,
    totalPages,
  };
}
