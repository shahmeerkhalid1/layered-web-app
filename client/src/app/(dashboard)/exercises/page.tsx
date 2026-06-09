"use client";

import { useState } from "react";
import type { Exercise, ExerciseFolder } from "@/lib/types";
import { ExerciseLibraryHeader } from "@/components/exercises/exercise-library-header";
import { ExerciseLibraryPagination } from "@/components/exercises/exercise-library-pagination";
import { ExerciseList } from "@/components/exercises/exercise-list";
import { FolderDialog } from "@/components/exercises/folder-dialog";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
import { useExerciseLibrary } from "@/hooks/exercises/use-exercise-library";

export default function ExercisesPage() {
  const library = useExerciseLibrary();
  const { folderDialog } = library;
  const [deleteExerciseTarget, setDeleteExerciseTarget] = useState<Exercise | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<ExerciseFolder | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const hasActiveFilters =
    library.selectedFolder !== null || library.search.trim().length > 0;

  const showFilteredEmpty =
    !library.loading &&
    library.exercises.length === 0 &&
    hasActiveFilters &&
    library.listTotalCount === 0 &&
    library.totalExerciseCount !== undefined &&
    library.totalExerciseCount > 0;

  return (
    <div className="space-y-6 rounded-[2rem] bg-background px-2 pb-6 sm:px-4">
      <ExerciseLibraryHeader
        totalExercises={library.listTotalCount ?? library.totalExerciseCount}
        folderCount={library.folders.length}
        visibleExerciseCount={library.exercises.length}
        loading={library.loading}
        hasActiveFilters={hasActiveFilters}
        onNewFolder={folderDialog.openCreate}
        search={library.search}
        onSearchChange={library.setSearch}
        folders={library.folders}
        totalExerciseCount={library.totalExerciseCount}
        selectedFolder={library.selectedFolder}
        onSelectFolder={library.setSelectedFolder}
        onEditFolder={folderDialog.openEdit}
        onRequestDeleteFolder={setDeleteFolderTarget}
      />

      <ExerciseList
        exercises={library.exercises}
        loading={library.loading}
        onRequestDeleteExercise={setDeleteExerciseTarget}
        showFilteredEmpty={showFilteredEmpty}
        onClearFilters={() => {
          library.setSearch("");
          library.setSelectedFolder(null);
        }}
      />

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <ExerciseLibraryPagination
          page={library.page}
          totalPages={library.totalPages}
          onPageChange={library.setPage}
          loading={library.loading}
          ariaLabel="Exercise list pagination"
        />
      </div>

      <FolderDialog
        open={folderDialog.open}
        onOpenChange={folderDialog.setOpen}
        folderName={folderDialog.name}
        onFolderNameChange={folderDialog.setName}
        editingFolder={folderDialog.editingFolder}
        onSave={folderDialog.save}
      />

      <ConfirmDestructiveDialog
        open={deleteExerciseTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteExerciseTarget(null);
        }}
        title="Delete exercise?"
        description={
          deleteExerciseTarget
            ? `“${deleteExerciseTarget.name}” will be removed from your library. It may still appear in past class plans and session notes.`
            : "This exercise will be removed from your library."
        }
        confirmLabel="Delete"
        confirmPendingLabel="Deleting…"
        pending={deletePending}
        confirmDisabled={!deleteExerciseTarget}
        onConfirm={async () => {
          if (!deleteExerciseTarget) return;
          setDeletePending(true);
          try {
            await library.deleteExercise(deleteExerciseTarget.id);
            setDeleteExerciseTarget(null);
          } finally {
            setDeletePending(false);
          }
        }}
      />

      <ConfirmDestructiveDialog
        open={deleteFolderTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteFolderTarget(null);
        }}
        title="Delete folder?"
        description={
          deleteFolderTarget
            ? `“${deleteFolderTarget.name}” will be removed. Exercises in this folder stay in your library without a folder.`
            : "This folder will be removed."
        }
        confirmLabel="Delete"
        confirmPendingLabel="Deleting…"
        pending={deletePending}
        confirmDisabled={!deleteFolderTarget}
        onConfirm={async () => {
          if (!deleteFolderTarget) return;
          setDeletePending(true);
          try {
            await folderDialog.delete(deleteFolderTarget.id);
            setDeleteFolderTarget(null);
          } finally {
            setDeletePending(false);
          }
        }}
      />
    </div>
  );
}
