"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { clientApi, CLIENT_PAGE_SIZE } from "@/services/client-api";
import type { Client } from "@/lib/types";

interface UseClientListOptions {
  search: string;
  debouncedSearch: string;
}

export function useClientList({ search, debouncedSearch }: UseClientListOptions) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [listTotalCount, setListTotalCount] = useState<number | undefined>(
    undefined
  );
  const [pageSize, setPageSize] = useState(CLIENT_PAGE_SIZE);
  const [fetchVersion, setFetchVersion] = useState(0);
  const activeRequestRef = useRef<AbortController | null>(null);
  const prevFiltersRef = useRef({ debouncedSearch });
  const fetchWaitersRef = useRef<VoidFunction[]>([]);

  const totalPages = Math.max(
    1,
    listTotalCount !== undefined ? Math.ceil(listTotalCount / pageSize) : 1
  );

  const refreshClients = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      fetchWaitersRef.current.push(resolve);
      setFetchVersion((v) => v + 1);
    });
  }, []);

  useEffect(() => {
    activeRequestRef.current?.abort();
  }, [search]);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const filterChanged = prev.debouncedSearch !== debouncedSearch;
    prevFiltersRef.current = { debouncedSearch };

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
        const data = await clientApi.listClients(
          {
            search: debouncedSearch || undefined,
            page,
            limit: CLIENT_PAGE_SIZE,
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

        setClients(data.data);
        setListTotalCount(data.total);
        setPageSize(data.limit);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        if (!cancelled) toast.error("Failed to load clients");
      } finally {
        if (!cancelled && activeRequestRef.current === controller) {
          activeRequestRef.current = null;
          flushWaiters();
          if (!skipLoadingClear) {
            setLoading(false);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedSearch, page, fetchVersion]);

  return {
    clients,
    loading,
    refreshClients,
    page,
    setPage,
    listTotalCount,
    pageSize,
    totalPages,
  };
}
