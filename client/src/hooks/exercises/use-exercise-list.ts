"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { exerciseApi } from "@/services/exercise-api";
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
  const activeRequestRef = useRef<AbortController | null>(null);

  const refreshExercises = useCallback(async () => {
    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;
    setLoading(true);

    try {
      const exerciseData = await exerciseApi.getExercises(
        {
          search: debouncedSearch || undefined,
          folderId: selectedFolder ?? undefined,
          savedToLibrary: true,
        },
        controller.signal
      );
      setExercises(exerciseData);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("Failed to load exercises");
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setLoading(false);
      }
    }
  }, [debouncedSearch, selectedFolder]);

  useEffect(() => {
    activeRequestRef.current?.abort();
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void refreshExercises();
      }
    });

    return () => {
      cancelled = true;
      activeRequestRef.current?.abort();
    };
  }, [refreshExercises]);

  return {
    exercises,
    loading,
    refreshExercises,
  };
}
