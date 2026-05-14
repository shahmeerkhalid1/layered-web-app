"use client";

import { ExerciseLibraryHeader } from "@/components/exercises/exercise-library-header";
import { ExerciseLibraryPagination } from "@/components/exercises/exercise-library-pagination";
import { ExerciseList } from "@/components/exercises/exercise-list";
import { FolderDialog } from "@/components/exercises/folder-dialog";
import { useExerciseLibrary } from "@/hooks/exercises/use-exercise-library";

export default function ExercisesPage() {
  const library = useExerciseLibrary();
  const { folderDialog } = library;

  const hasActiveFilters =
    library.selectedFolder !== null || library.search.trim().length > 0;

  const showFilteredEmpty =
    !library.loading &&
    library.exercises.length === 0 &&
    hasActiveFilters &&
    library.totalExerciseCount !== undefined &&
    library.totalExerciseCount > 0;

  return (
    <div className="space-y-6 rounded-[2rem] bg-background px-2 pb-6 sm:px-4">
      <ExerciseLibraryHeader
        totalExercises={library.totalExerciseCount}
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
        onDeleteFolder={folderDialog.delete}
      />

      <ExerciseList
        exercises={library.exercises}
        loading={library.loading}
        onDeleteExercise={library.deleteExercise}
        showFilteredEmpty={showFilteredEmpty}
        onClearFilters={() => {
          library.setSearch("");
          library.setSelectedFolder(null);
        }}
      />

      {!library.loading && library.exercises.length > 0 ? (
        <ExerciseLibraryPagination />
      ) : null}

      <FolderDialog
        open={folderDialog.open}
        onOpenChange={folderDialog.setOpen}
        folderName={folderDialog.name}
        onFolderNameChange={folderDialog.setName}
        editingFolder={folderDialog.editingFolder}
        onSave={folderDialog.save}
      />
    </div>
  );
}
