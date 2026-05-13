"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { classPlanApi } from "@/services/class-plan-api";
import type { ClassPlanFolder } from "@/lib/types";

interface UseClassPlanFoldersOptions {
  selectedFolder: string | null;
  setSelectedFolder: (folderId: string | null) => void;
  refreshTemplates: () => Promise<void>;
}

export function useClassPlanFolders({
  selectedFolder,
  setSelectedFolder,
  refreshTemplates,
}: UseClassPlanFoldersOptions) {
  const [folders, setFolders] = useState<ClassPlanFolder[]>([]);
  const [totalTemplateCount, setTotalTemplateCount] = useState<number | undefined>(
    undefined
  );
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<ClassPlanFolder | null>(null);

  const refreshFolders = useCallback(async () => {
    try {
      const { folders: folderData, totalTemplates } = await classPlanApi.getFolders();
      setFolders(folderData);
      setTotalTemplateCount(totalTemplates);
    } catch {
      toast.error("Failed to load class plan folders");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void refreshFolders();
    });
    return () => {
      cancelled = true;
    };
  }, [refreshFolders]);

  const refreshLibrary = useCallback(async () => {
    await Promise.all([refreshTemplates(), refreshFolders()]);
  }, [refreshTemplates, refreshFolders]);

  const openCreateFolderDialog = () => {
    setEditingFolder(null);
    setFolderName("");
    setFolderDialogOpen(true);
  };

  const openEditFolderDialog = (folder: ClassPlanFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDialogOpen(true);
  };

  const saveFolder = async () => {
    const name = folderName.trim();
    if (!name) return;

    try {
      if (editingFolder) {
        await classPlanApi.updateFolder(editingFolder.id, { name });
        toast.success("Folder updated");
      } else {
        await classPlanApi.createFolder({ name });
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
      await classPlanApi.deleteFolder(id);
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
    totalTemplateCount,
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
