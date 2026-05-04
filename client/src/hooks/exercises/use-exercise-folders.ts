"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { exerciseApi } from "@/services/exercise-api";
import type { ExerciseFolder } from "@/lib/types";

interface UseExerciseFoldersOptions {
  selectedFolder: string | null;
  setSelectedFolder: (folderId: string | null) => void;
  refreshExercises: () => Promise<void>;
}

export function useExerciseFolders({
  selectedFolder,
  setSelectedFolder,
  refreshExercises,
}: UseExerciseFoldersOptions) {
  const [folders, setFolders] = useState<ExerciseFolder[]>([]);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<ExerciseFolder | null>(null);

  const refreshFolders = useCallback(async () => {
    try {
      const folderData = await exerciseApi.getFolders();
      setFolders(folderData);
    } catch {
      toast.error("Failed to load folders");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void refreshFolders();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [refreshFolders]);

  const refreshLibrary = useCallback(async () => {
    await Promise.all([refreshExercises(), refreshFolders()]);
  }, [refreshExercises, refreshFolders]);

  const openCreateFolderDialog = () => {
    setEditingFolder(null);
    setFolderName("");
    setFolderDialogOpen(true);
  };

  const openEditFolderDialog = (folder: ExerciseFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDialogOpen(true);
  };

  const saveFolder = async () => {
    const name = folderName.trim();
    if (!name) return;

    try {
      if (editingFolder) {
        await exerciseApi.updateFolder(editingFolder.id, { name });
        toast.success("Folder updated");
      } else {
        await exerciseApi.createFolder({ name });
        toast.success("Folder created");
      }

      setFolderDialogOpen(false);
      setFolderName("");
      setEditingFolder(null);
      void refreshLibrary();
    } catch {
      toast.error("Failed to save folder");
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      await exerciseApi.deleteFolder(id);
      const deletedSelectedFolder = selectedFolder === id;
      if (deletedSelectedFolder) setSelectedFolder(null);
      toast.success("Folder deleted");
      void (deletedSelectedFolder ? refreshFolders() : refreshLibrary());
    } catch {
      toast.error("Failed to delete folder");
    }
  };

  return {
    folders,
    refreshFolders,
    folderDialog: {
      open: folderDialogOpen,
      setOpen: setFolderDialogOpen,
      name: folderName,
      setName: setFolderName,
      editingFolder,
      openCreate: openCreateFolderDialog,
      openEdit: openEditFolderDialog,
      save: saveFolder,
      delete: deleteFolder,
    },
  };
}
