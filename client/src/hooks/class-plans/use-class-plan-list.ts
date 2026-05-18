"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { classPlanApi } from "@/services/class-plan-api";
import type { ClassPlanTemplate } from "@/lib/types";

const LIST_LIMIT = 100;

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
  const activeRequestRef = useRef<AbortController | null>(null);

  const refreshTemplates = useCallback(async () => {
    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;
    setLoading(true);

    try {
      const listParams = {
        page: 1,
        limit: LIST_LIMIT,
        search: debouncedSearch || undefined,
        folderId: selectedFolder !== null ? selectedFolder : undefined,
        classType: classTypeFilter || undefined,
        classStyle: classStyleFilter || undefined,
        tags: tagFilter || undefined,
      };

      const res = await classPlanApi.listClassPlans(listParams, controller.signal);
      setTemplates(res.data);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("Failed to load class plans");
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setLoading(false);
      }
    }
  }, [debouncedSearch, selectedFolder, classTypeFilter, classStyleFilter, tagFilter]);

  useEffect(() => {
    activeRequestRef.current?.abort();
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void refreshTemplates();
    });
    return () => {
      cancelled = true;
      activeRequestRef.current?.abort();
    };
  }, [refreshTemplates]);

  return {
    templates,
    loading,
    refreshTemplates,
  };
}
