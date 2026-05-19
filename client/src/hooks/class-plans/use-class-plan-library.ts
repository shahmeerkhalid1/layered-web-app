"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { classPlanApi } from "@/services/class-plan-api";
import { useExerciseSearch } from "@/hooks/exercises/use-exercise-search";
import { useClassPlanFolders } from "@/hooks/class-plans/use-class-plan-folders";
import { useClassPlanList } from "@/hooks/class-plans/use-class-plan-list";

export function useClassPlanLibrary() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [classTypeFilter, setClassTypeFilter] = useState("");
  const [classStyleFilter, setClassStyleFilter] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const { search, setSearch, debouncedSearch } = useExerciseSearch();
  const templateList = useClassPlanList({
    search,
    debouncedSearch,
    selectedFolder,
    classTypeFilter,
    classStyleFilter,
    tagFilter,
  });
  const folderState = useClassPlanFolders({
    selectedFolder,
    setSelectedFolder,
    refreshTemplates: templateList.refreshTemplates,
  });

  const deleteClassPlan = useCallback(
    async (id: string) => {
      try {
        await classPlanApi.deleteClassPlan(id);
        toast.success("Class plan deleted");
        void Promise.all([
          templateList.refreshTemplates(),
          folderState.refreshFolders(),
        ]);
      } catch {
        toast.error("Failed to delete class plan");
      }
    },
    [folderState, templateList]
  );

  const duplicateClassPlan = useCallback(
    async (id: string) => {
      try {
        await classPlanApi.duplicateClassPlan(id);
        toast.success("Class plan duplicated");
        void Promise.all([
          templateList.refreshTemplates(),
          folderState.refreshFolders(),
        ]);
      } catch {
        toast.error("Failed to duplicate class plan");
      }
    },
    [folderState, templateList]
  );

  return {
    templates: templateList.templates,
    folders: folderState.folders,
    totalTemplateCount: folderState.totalTemplateCount,
    listTotalCount: templateList.listTotalCount,
    search,
    setSearch,
    selectedFolder,
    setSelectedFolder,
    classTypeFilter,
    setClassTypeFilter,
    classStyleFilter,
    setClassStyleFilter,
    tagFilter,
    setTagFilter,
    loading: templateList.loading,
    page: templateList.page,
    setPage: templateList.setPage,
    totalPages: templateList.totalPages,
    folderDialog: folderState.folderDialog,
    refreshTemplates: templateList.refreshTemplates,
    refreshFolders: folderState.refreshFolders,
    deleteClassPlan,
    duplicateClassPlan,
  };
}
