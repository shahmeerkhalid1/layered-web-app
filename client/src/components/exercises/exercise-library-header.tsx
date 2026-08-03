"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import type { ExerciseFolder } from "@/lib/types";
import { ExerciseSearch } from "@/components/exercises/exercise-search";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FILTER_SELECT_EMPTY_VALUES } from "@/lib/form-control-styles";
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
  onRequestDeleteFolder: (folder: ExerciseFolder) => void;
  onNewExercise?: () => void;
  createDisabled?: boolean;
  createDisabledTitle?: string;
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
  onRequestDeleteFolder,
  onNewExercise,
  createDisabled = false,
  createDisabledTitle = "Upgrade to create more exercises",
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

  const subtitle = totalKnown
    ? hasActiveFilters
      ? `Showing ${visibleExerciseCount} of ${total} exercise${total === 1 ? "" : "es"} · ${folderCount} folder${folderCount === 1 ? "" : "s"}`
      : `${total} exercise${total === 1 ? "" : "es"} · ${folderCount} folder${folderCount === 1 ? "" : "s"}`
    : loading
      ? "Loading library…"
      : "0 exercises · 0 folders";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <header className="space-y-2">
          <p className="layered-eyebrow">Exercises</p>
          <h1 className="layered-display-headline">Exercise library</h1>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {subtitle}
          </p>
        </header>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded border border-[var(--layered-black)] bg-transparent px-4 shadow-none"
            onClick={onNewFolder}
          >
            <FolderPlus className="mr-2 size-4" />
            New folder
          </Button>
          {onNewExercise ? (
            <button
              type="button"
              onClick={createDisabled ? undefined : onNewExercise}
              disabled={createDisabled}
              title={createDisabled ? createDisabledTitle : undefined}
              className={cn(
                buttonVariants({ variant: "default" }),
                "inline-flex h-10 items-center justify-center rounded bg-primary px-5 text-primary-foreground shadow-none hover:bg-primary/90",
                createDisabled && "pointer-events-none opacity-50",
              )}
            >
              <Plus className="mr-2 size-4" />
              New exercise
            </button>
          ) : (
            <Link
              href="/exercises/new"
              className={cn(
                buttonVariants({ variant: "default" }),
                "inline-flex h-10 items-center justify-center rounded bg-primary px-5 text-primary-foreground shadow-none hover:bg-primary/90",
              )}
            >
              <Plus className="mr-2 size-4" />
              New exercise
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[260px] flex-1">
          <ExerciseSearch
            id="exercise-library-search"
            value={search}
            onChange={onSearchChange}
            placeholder="Search by exercise name…"
          />
        </div>

        <div className="w-full min-w-[180px] sm:w-auto">
          <Select
            value={selectValue}
            emptyValues={FILTER_SELECT_EMPTY_VALUES}
            onValueChange={(value) => {
              if (!value || value === "all") onSelectFolder(null);
              else if (value === "none") onSelectFolder("none");
              else onSelectFolder(value);
            }}
          >
            <SelectTrigger
              id="exercise-library-folder"
              className="h-10 w-full min-w-[180px] rounded border-border bg-card px-3 shadow-none"
            >
              <SelectValue placeholder="All exercises">{folderSelectLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start" sideOffset={6} className="rounded border-border p-1">
              <SelectItem value="all" className="rounded py-2 pl-3">
                {totalExerciseCount !== undefined ? (
                  <span>All exercises ({totalExerciseCount})</span>
                ) : (
                  <span>All exercises</span>
                )}
              </SelectItem>
              <SelectItem value="none" className="rounded py-2 pl-3">
                <span>Unorganized</span>
              </SelectItem>
              {folders.length > 0 && (
                <>
                  <SelectSeparator />
                  {folders.map((f) => {
                    const n = f._count?.exercises;
                    return (
                      <SelectItem key={f.id} value={f.id} className="rounded py-2 pl-3">
                        {n !== undefined ? `${f.name} (${n})` : f.name}
                      </SelectItem>
                    );
                  })}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedFolderRow ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded border-border px-3 shadow-none"
              onClick={() => onEditFolder(selectedFolderRow)}
              aria-label={`Rename folder ${selectedFolderRow.name}`}
            >
              <Pencil className="mr-2 size-4" />
              Rename
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded border-border px-3 text-destructive shadow-none hover:bg-destructive/10"
              onClick={() => onRequestDeleteFolder(selectedFolderRow)}
              aria-label={`Delete folder ${selectedFolderRow.name}`}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
