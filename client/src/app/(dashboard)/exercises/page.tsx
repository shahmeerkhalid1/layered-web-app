"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { exerciseApi } from "@/services/exercise-api";
import type { Exercise, ExerciseFolder } from "@/lib/types";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Search,
  FolderOpen,
  Dumbbell,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [folders, setFolders] = useState<ExerciseFolder[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);
  const activeRequestRef = useRef<AbortController | null>(null);

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<ExerciseFolder | null>(null);

  const fetchData = useCallback(async () => {
    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedFolder) params.folderId = selectedFolder;

      const [exerciseData] = await Promise.all([
        exerciseApi.getExercises(params, controller.signal),
        // exerciseApi.getFolders(),
      ]);
      setExercises(exerciseData);
      // setFolders(folderData);
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
        void fetchData();
      }
    });

    return () => {
      cancelled = true;
      activeRequestRef.current?.abort();
    };
  }, [fetchData]);

  const handleDeleteExercise = async (id: string) => {
    try {
      await exerciseApi.deleteExercise(id);
      toast.success("Exercise deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete exercise");
    }
  };

  const handleSaveFolder = async () => {
    try {
      if (editingFolder) {
        await exerciseApi.updateFolder(editingFolder.id, {
          name: folderName,
        });
        toast.success("Folder updated");
      } else {
        await exerciseApi.createFolder({ name: folderName });
        toast.success("Folder created");
      }
      setFolderDialogOpen(false);
      setFolderName("");
      setEditingFolder(null);
      fetchData();
    } catch {
      toast.error("Failed to save folder");
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await exerciseApi.deleteFolder(id);
      if (selectedFolder === id) setSelectedFolder(null);
      toast.success("Folder deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete folder");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Exercise Library</h2>
          <p className="text-muted-foreground">
            Manage your exercise collection
          </p>
        </div>
        <Link href="/exercises/new">
          <Button>
            <Plus className="mr-2 size-4" />
            New Exercise
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Folder sidebar */}
        <div className="w-full space-y-2 lg:w-56 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Folders</h3>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setEditingFolder(null);
                setFolderName("");
                setFolderDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <button
            onClick={() => setSelectedFolder(null)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              !selectedFolder
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <Dumbbell className="size-4" />
            All Exercises
          </button>

          {folders.map((folder) => (
            <div key={folder.id} className="group flex items-center">
              <button
                onClick={() => setSelectedFolder(folder.id)}
                className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedFolder === folder.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <FolderOpen className="size-4" />
                <span className="truncate">{folder.name}</span>
                {folder._count && (
                  <span className="ml-auto text-xs opacity-60">
                    {folder._count.exercises}
                  </span>
                )}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingFolder(folder);
                      setFolderName(folder.name);
                      setFolderDialogOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 size-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 w-2/3 rounded bg-muted" />
                    <div className="mt-2 h-3 w-full rounded bg-muted" />
                    <div className="mt-1 h-3 w-1/2 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <Dumbbell className="size-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No exercises yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first exercise to get started
              </p>
              <Link href="/exercises/new" className="mt-4">
                <Button size="sm">
                  <Plus className="mr-2 size-4" />
                  New Exercise
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {exercises.map((exercise) => (
                <Card key={exercise.id} className="group relative">
                  <Link href={`/exercises/${exercise.id}`}>
                    <CardContent className="p-4">
                      {exercise.images?.[0] && (
                        <div className="mb-3 aspect-video overflow-hidden rounded-md bg-muted">
                          <img
                            src={exercise.images[0].url}
                            alt={exercise.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <h3 className="font-semibold">{exercise.name}</h3>
                      {exercise.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {exercise.description}
                        </p>
                      )}
                      {exercise.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {exercise.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {exercise.folder && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <FolderOpen className="size-3" />
                          {exercise.folder.name}
                        </p>
                      )}
                    </CardContent>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link href={`/exercises/${exercise.id}/edit`}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Folder dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? "Rename Folder" : "New Folder"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g. Reformer, Mat, Chair"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFolderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveFolder} disabled={!folderName.trim()}>
              {editingFolder ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
