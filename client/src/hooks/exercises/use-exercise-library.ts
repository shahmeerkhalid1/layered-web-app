"use client";

import { useState } from "react";
import { toast } from "sonner";
import { exerciseApi } from "@/services/exercise-api";
import { useExerciseFolders } from "@/hooks/exercises/use-exercise-folders";
import { useExerciseList } from "@/hooks/exercises/use-exercise-list";
import { useExerciseSearch } from "@/hooks/exercises/use-exercise-search";

export function useExerciseLibrary() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const { search, setSearch, debouncedSearch } = useExerciseSearch();
  const exerciseList = useExerciseList({
    search,
    debouncedSearch,
    selectedFolder,
  });
  const folderState = useExerciseFolders({
    selectedFolder,
    setSelectedFolder,
    refreshExercises: exerciseList.refreshExercises,
  });

  const deleteExercise = async (id: string) => {
    try {
      await exerciseApi.deleteExercise(id);
      toast.success("Exercise deleted");
      void Promise.all([
        exerciseList.refreshExercises(),
        folderState.refreshFolders(),
      ]);
    } catch {
      toast.error("Failed to delete exercise");
    }
  };

  return {
    exercises: exerciseList.exercises,
    folders: folderState.folders,
    totalExerciseCount: folderState.totalExerciseCount,
    listTotalCount: exerciseList.listTotalCount,
    search,
    setSearch,
    selectedFolder,
    setSelectedFolder,
    loading: exerciseList.loading,
    page: exerciseList.page,
    setPage: exerciseList.setPage,
    totalPages: exerciseList.totalPages,
    folderDialog: folderState.folderDialog,
    deleteExercise,
  };
}
