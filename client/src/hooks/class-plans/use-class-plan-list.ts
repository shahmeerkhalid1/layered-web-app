"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  classPlanApi,
  CLASS_PLAN_LIBRARY_PAGE_SIZE,
} from "@/services/class-plan-api";
import type { ClassPlanTemplate } from "@/lib/types";

interface UseClassPlanListOptions {
  search: string;
  debouncedSearch: string;
  /** `null` = all plans, `"none"` = no folder assigned, else folder id */
  selectedFolder: string | null;
  classTypeFilter: string;
  classStyleFilter: string;
  tagFilter: string | null;
}

export function useClassPlanList({
  search,
  debouncedSearch,
  selectedFolder,
  classTypeFilter,
  classStyleFilter,
  tagFilter,
}: UseClassPlanListOptions) {
  const [templates, setTemplates] = useState<ClassPlanTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [listTotalCount, setListTotalCount] = useState<number | undefined>(
    undefined
  );
  const [pageSize, setPageSize] = useState(CLASS_PLAN_LIBRARY_PAGE_SIZE);
  const [fetchVersion, setFetchVersion] = useState(0);
  const activeRequestRef = useRef<AbortController | null>(null);
  const prevFiltersRef = useRef({
    debouncedSearch,
    selectedFolder,
    classTypeFilter,
    classStyleFilter,
    tagFilter,
  });
  const fetchWaitersRef = useRef<VoidFunction[]>([]);

  const totalPages = Math.max(
    1,
    listTotalCount !== undefined
      ? Math.ceil(listTotalCount / pageSize)
      : 1
  );

  const refreshTemplates = useCallback((): Promise<void> => {
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
      prev.selectedFolder !== selectedFolder ||
      prev.classTypeFilter !== classTypeFilter ||
      prev.classStyleFilter !== classStyleFilter ||
      prev.tagFilter !== tagFilter;
    prevFiltersRef.current = {
      debouncedSearch,
      selectedFolder,
      classTypeFilter,
      classStyleFilter,
      tagFilter,
    };

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
        const res = await classPlanApi.listClassPlans(
          {
            page,
            limit: CLASS_PLAN_LIBRARY_PAGE_SIZE,
            search: debouncedSearch || undefined,
            folderId:
              selectedFolder !== null ? selectedFolder : undefined,
            classType: classTypeFilter || undefined,
            classStyle: classStyleFilter || undefined,
            tags: tagFilter || undefined,
          },
          controller.signal
        );
        if (cancelled) return;

        const maxPage = Math.max(1, Math.ceil(res.total / res.limit));
        if (page > maxPage) {
          setPage(maxPage);
          skipLoadingClear = true;
          return;
        }

        setTemplates(res.data);
        setListTotalCount(res.total);
        setPageSize(res.limit);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        if (!cancelled) toast.error("Failed to load class plans");
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
  }, [
    debouncedSearch,
    selectedFolder,
    classTypeFilter,
    classStyleFilter,
    tagFilter,
    page,
    fetchVersion,
  ]);

  return {
    templates,
    loading,
    refreshTemplates,
    page,
    setPage,
    listTotalCount,
    pageSize,
    totalPages,
  };
}
