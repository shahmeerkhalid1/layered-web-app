"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import type { ExerciseFolder } from "@/lib/types";
import { ExerciseSearch } from "@/components/exercises/exercise-search";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface ExerciseLibraryHeaderProps {
  totalExercises?: number;
  folderCount: number;
  visibleExerciseCount: number;
  loading: boolean;
  hasActiveFilters: boolean;
  onNewFolder: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  folders: ExerciseFolder[];
  totalExerciseCount?: number;
  /** `null` = all exercises, `"none"` = no folder assigned, else folder id */
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onEditFolder: (folder: ExerciseFolder) => void;
  onDeleteFolder: (folderId: string) => void;
}

export function ExerciseLibraryHeader({
  totalExercises,
  folderCount,
  visibleExerciseCount,
  loading,
  hasActiveFilters,
  onNewFolder,
  search,
  onSearchChange,
  folders,
  totalExerciseCount,
  selectedFolder,
  onSelectFolder,
  onEditFolder,
  onDeleteFolder,
}: ExerciseLibraryHeaderProps) {
  const totalKnown = totalExercises !== undefined;
  const total = totalExercises ?? 0;

  const selectValue = selectedFolder ?? "all";

  const selectedFolderRow = useMemo(
    () =>
      selectedFolder && selectedFolder !== "none"
        ? folders.find((f) => f.id === selectedFolder)
        : undefined,
    [folders, selectedFolder],
  );

  const folderSelectLabel = useMemo(() => {
    if (selectedFolder === null) {
      return totalExerciseCount !== undefined
        ? `All exercises (${totalExerciseCount})`
        : "All exercises";
    }
    if (selectedFolder === "none") {
      return "Unorganized";
    }
    const f = folders.find((x) => x.id === selectedFolder);
    if (!f) return "Folder";
    const n = f._count?.exercises;
    return n !== undefined ? `${f.name} (${n})` : f.name;
  }, [selectedFolder, folders, totalExerciseCount]);

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0 max-w-2xl space-y-2">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-card-foreground sm:text-3xl">
            Exercise Library
          </h2>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground" aria-live="polite">
            {!totalKnown && loading && <span>Loading library…</span>}
            {totalKnown && (
              <>
                <span className="font-medium text-foreground">
                  {hasActiveFilters
                    ? `Showing ${visibleExerciseCount} of ${total} exercise${total === 1 ? "" : "es"}`
                    : `${total} exercise${total === 1 ? "" : "es"}`}
                </span>
                <span className="text-muted-foreground/50" aria-hidden>
                  ·
                </span>
                <span>
                  {folderCount} folder{folderCount === 1 ? "" : "s"}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full border-border px-4"
            onClick={onNewFolder}
          >
            <FolderPlus className="mr-2 size-4" />
            New folder
          </Button>
          <Link
            href="/exercises/new"
            className={cn(
              buttonVariants({ variant: "default" }),
              "inline-flex h-10 items-center justify-center rounded-full px-5 text-primary-foreground shadow-md hover:bg-primary/90",
            )}
          >
            <Plus className="mr-2 size-4" />
            New exercise
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-3 border-t border-border pt-5">
        <div className="min-w-0 flex-1 basis-52 space-y-2 sm:basis-64">
          <Label htmlFor="exercise-library-search" className="text-muted-foreground">
            Search
          </Label>
          <ExerciseSearch
            id="exercise-library-search"
            value={search}
            onChange={onSearchChange}
          />
        </div>

        <div className="w-full min-w-44 max-w-xs shrink-0 space-y-2 sm:w-56">
          <Label htmlFor="exercise-library-folder" className="text-muted-foreground">
            Folder
          </Label>
          <Select
            value={selectValue}
            onValueChange={(value) => {
              if (!value || value === "all") onSelectFolder(null);
              else if (value === "none") onSelectFolder("none");
              else onSelectFolder(value);
            }}
          >
            <SelectTrigger
              id="exercise-library-folder"
              className="h-12 w-full min-w-0 rounded-2xl border-input bg-background/70 px-4 shadow-none focus-visible:ring-ring/35 data-placeholder:text-muted-foreground"
            >
              <SelectValue placeholder="All exercises">{folderSelectLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent
              align="start"
              sideOffset={6}
              className="max-h-72 rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
            >
              <SelectItem value="all" className="rounded-xl py-2.5 pl-3">
                {totalExerciseCount !== undefined ? (
                  <span>All exercises ({totalExerciseCount})</span>
                ) : (
                  <span>All exercises</span>
                )}
              </SelectItem>
              <SelectItem value="none" className="rounded-xl py-2.5 pl-3">
                <span>Unorganized</span>
              </SelectItem>
              {folders.length > 0 && (
                <>
                  <SelectSeparator className="mx-1 bg-border/70" />
                  {folders.map((f) => {
                    const n = f._count?.exercises;
                    return (
                      <SelectItem key={f.id} value={f.id} className="rounded-xl py-2.5 pl-3">
                        {n !== undefined ? `${f.name} (${n})` : f.name}
                      </SelectItem>
                    );
                  })}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedFolderRow && (
          <div className="flex shrink-0 flex-col space-y-2">
            <Label className="invisible pointer-events-none select-none text-muted-foreground" aria-hidden>
              Folder
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 min-h-12 shrink-0 rounded-2xl border-border px-4"
                onClick={() => onEditFolder(selectedFolderRow)}
                aria-label={`Rename folder ${selectedFolderRow.name}`}
              >
                <Pencil className="mr-2 size-4" />
                Rename
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 min-h-12 shrink-0 rounded-2xl border-border px-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDeleteFolder(selectedFolderRow.id)}
                aria-label={`Delete folder ${selectedFolderRow.name}`}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
