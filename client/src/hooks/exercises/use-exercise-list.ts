"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  exerciseApi,
  EXERCISE_LIBRARY_PAGE_SIZE,
} from "@/services/exercise-api";
import type { Exercise } from "@/lib/types";

interface UseExerciseListOptions {
  search: string;
  debouncedSearch: string;
  /** `null` = all exercises, `"none"` = no folder assigned, else folder id */
  selectedFolder: string | null;
}

export function useExerciseList({
  search,
  debouncedSearch,
  selectedFolder,
}: UseExerciseListOptions) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [listTotalCount, setListTotalCount] = useState<number | undefined>(
    undefined
  );
  const [pageSize, setPageSize] = useState(EXERCISE_LIBRARY_PAGE_SIZE);
  const [fetchVersion, setFetchVersion] = useState(0);
  const activeRequestRef = useRef<AbortController | null>(null);
  const prevFiltersRef = useRef({ debouncedSearch, selectedFolder });
  const fetchWaitersRef = useRef<VoidFunction[]>([]);

  const totalPages = Math.max(
    1,
    listTotalCount !== undefined
      ? Math.ceil(listTotalCount / pageSize)
      : 1
  );

  const refreshExercises = useCallback((): Promise<void> => {
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
    const filterChanged =
      prev.debouncedSearch !== debouncedSearch ||
      prev.selectedFolder !== selectedFolder;
    prevFiltersRef.current = { debouncedSearch, selectedFolder };

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
        const data = await exerciseApi.getExerciseListPage(
          {
            search: debouncedSearch || undefined,
            folderId: selectedFolder ?? undefined,
            savedToLibrary: true,
            page,
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

        setExercises(data.exercises);
        setListTotalCount(data.total);
        setPageSize(data.limit);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        if (!cancelled) toast.error("Failed to load exercises");
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
  }, [debouncedSearch, selectedFolder, page, fetchVersion]);

  return {
    exercises,
    loading,
    refreshExercises,
    page,
    setPage,
    listTotalCount,
    pageSize,
    totalPages,
  };
}
