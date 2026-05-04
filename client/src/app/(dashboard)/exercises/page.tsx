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
    <div className="space-y-6">
      <ExerciseLibraryHeader />

      <div className="flex flex-col gap-6 lg:flex-row">
        <ExerciseFolderSidebar
          folders={library.folders}
          selectedFolder={library.selectedFolder}
          onSelectFolder={library.setSelectedFolder}
          onCreateFolder={folderDialog.openCreate}
          onEditFolder={folderDialog.openEdit}
          onDeleteFolder={folderDialog.delete}
        />

        <main className="flex-1 space-y-4">
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
