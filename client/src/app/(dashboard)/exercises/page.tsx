"use client";

import { ExerciseFolderSidebar } from "@/components/exercises/exercise-folder-sidebar";
import { ExerciseLibraryHeader } from "@/components/exercises/exercise-library-header";
import { ExerciseList } from "@/components/exercises/exercise-list";
import { ExerciseSearch } from "@/components/exercises/exercise-search";
import { FolderDialog } from "@/components/exercises/folder-dialog";
import { useExerciseLibrary } from "@/hooks/exercises/use-exercise-library";

export default function ExercisesPage() {
  const library = useExerciseLibrary();
  const { folderDialog } = library;

  return (
    <div className="relative space-y-6 overflow-hidden rounded-[2rem] bg-background p-1">
      <div className="pointer-events-none absolute top-16 right-10 h-48 w-48 rounded-full bg-secondary/60 blur-3xl" />
      <ExerciseLibraryHeader />

      <div className="relative flex flex-col gap-6 lg:flex-row">
        <ExerciseFolderSidebar
          folders={library.folders}
          selectedFolder={library.selectedFolder}
          onSelectFolder={library.setSelectedFolder}
          onCreateFolder={folderDialog.openCreate}
          onEditFolder={folderDialog.openEdit}
          onDeleteFolder={folderDialog.delete}
        />

        <main className="min-w-0 flex-1 space-y-5">
          <ExerciseSearch value={library.search} onChange={library.setSearch} />
          <ExerciseList
            exercises={library.exercises}
            loading={library.loading}
            onDeleteExercise={library.deleteExercise}
          />
        </main>
      </div>

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
