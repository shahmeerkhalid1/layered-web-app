"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown, FolderPlus, ListFilter, Pencil, Plus, Trash2 } from "lucide-react";
import type { ClassPlanFolder } from "@/lib/types";
import { ClassPlanFilterBar } from "@/components/class-plans/class-plan-filter-bar";
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
import { FILTER_SELECT_EMPTY_VALUES } from "@/lib/form-control-styles";
import { cn } from "@/lib/utils";

export interface ClassPlanLibraryHeaderProps {
  totalPlans?: number;
  folderCount: number;
  visiblePlanCount: number;
  loading: boolean;
  hasActiveFilters: boolean;
  onNewFolder: () => void;
  onNewPlan: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  folders: ClassPlanFolder[];
  totalTemplateCount?: number;
  /** `null` = all, `"none"` = plans not in any folder, else folder id */
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onEditFolder: (folder: ClassPlanFolder) => void;
  onDeleteFolder: (folderId: string) => void;
  classTypeFilter: string;
  onClassTypeFilterChange: (value: string) => void;
  classStyleFilter: string;
  onClassStyleFilterChange: (value: string) => void;
  tagFilter: string | null;
  onTagFilterChange: (value: string | null) => void;
  /** Clears search, folder, class type, style, and tag filters */
  onClearAllFilters: () => void;
}

export function ClassPlanLibraryHeader({
  totalPlans,
  folderCount,
  visiblePlanCount,
  loading,
  hasActiveFilters,
  onNewFolder,
  onNewPlan,
  search,
  onSearchChange,
  folders,
  totalTemplateCount,
  selectedFolder,
  onSelectFolder,
  onEditFolder,
  onDeleteFolder,
  classTypeFilter,
  onClassTypeFilterChange,
  classStyleFilter,
  onClassStyleFilterChange,
  tagFilter,
  onTagFilterChange,
  onClearAllFilters,
}: ClassPlanLibraryHeaderProps) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const advancedFiltersPanelId = useId();

  const totalKnown = totalPlans !== undefined;
  const total = totalPlans ?? 0;

  const hasAdvancedFilters =
    classTypeFilter.length > 0 || classStyleFilter.length > 0 || tagFilter !== null;

  const advancedFilterCount = useMemo(() => {
    let n = 0;
    if (classTypeFilter.length > 0) n += 1;
    if (classStyleFilter.length > 0) n += 1;
    if (tagFilter !== null) n += 1;
    return n;
  }, [classTypeFilter, classStyleFilter, tagFilter]);

  const selectValue = selectedFolder ?? "all";

  const selectedFolderRow = useMemo(
    () =>
      selectedFolder && selectedFolder !== "none"
        ? folders.find((f) => f.id === selectedFolder)
        : undefined,
    [folders, selectedFolder]
  );

  const folderSelectLabel = useMemo(() => {
    if (selectedFolder === null) {
      return totalTemplateCount !== undefined
        ? `All plans (${totalTemplateCount})`
        : "All plans";
    }
    if (selectedFolder === "none") {
      return "Unorganized";
    }
    const f = folders.find((x) => x.id === selectedFolder);
    if (!f) return "Folder";
    const n = f._count?.templates;
    return n !== undefined ? `${f.name} (${n})` : f.name;
  }, [selectedFolder, folders, totalTemplateCount]);

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0 max-w-2xl space-y-2">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-card-foreground sm:text-3xl">
            Class Plans
          </h2>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground" aria-live="polite">
            {!totalKnown && loading && <span>Loading library…</span>}
            {totalKnown && (
              <>
                <span className="font-medium text-foreground">
                  {hasActiveFilters
                    ? `Showing ${visiblePlanCount} of ${total} plan${total === 1 ? "" : "s"}`
                    : `${total} plan${total === 1 ? "" : "s"}`}
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
          <button
            type="button"
            onClick={onNewPlan}
            className={cn(
              buttonVariants({ variant: "default" }),
              "inline-flex h-10 items-center justify-center rounded-full px-5 text-primary-foreground shadow-md hover:bg-primary/90"
            )}
          >
            <Plus className="mr-2 size-4" />
            New plan
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-3 border-t border-border pt-5">
        <div className="min-w-0 flex-1 basis-52 space-y-2 sm:basis-64">
          <Label htmlFor="class-plan-library-search" className="text-muted-foreground">
            Search
          </Label>
          <ExerciseSearch
            id="class-plan-library-search"
            value={search}
            onChange={onSearchChange}
            placeholder="Search by plan name…"
          />
        </div>

        <div className="w-full min-w-44 max-w-xs shrink-0 space-y-2 sm:w-56">
          <Label htmlFor="class-plan-library-folder" className="text-muted-foreground">
            Folder
          </Label>
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
              id="class-plan-library-folder"
              className="h-12 w-full min-w-0 rounded-2xl border-input bg-background/70 px-4 shadow-none focus-visible:ring-ring/35 data-placeholder:text-muted-foreground"
            >
              <SelectValue placeholder="All plans">{folderSelectLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent
              align="start"
              sideOffset={6}
              className="max-h-72 rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
            >
              <SelectItem value="all" className="rounded-xl py-2.5 pl-3">
                {totalTemplateCount !== undefined ? (
                  <span>All plans ({totalTemplateCount})</span>
                ) : (
                  <span>All plans</span>
                )}
              </SelectItem>
              <SelectItem value="none" className="rounded-xl py-2.5 pl-3">
                <span>Unorganized</span>
              </SelectItem>
              {folders.length > 0 && (
                <>
                  <SelectSeparator className="mx-1 bg-border/70" />
                  {folders.map((f) => {
                    const n = f._count?.templates;
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

      <div className="border-t border-border pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full border-border px-4"
            aria-expanded={filtersExpanded}
            aria-controls={advancedFiltersPanelId}
            onClick={() => setFiltersExpanded((open) => !open)}
          >
            <ListFilter className="mr-2 size-4 shrink-0" />
            <span>Filters</span>
            {hasAdvancedFilters ? (
              <span
                className="ml-2 inline-flex min-w-5 justify-center rounded-full bg-primary/15 px-1.5 text-xs font-medium tabular-nums text-primary"
                aria-label={`${advancedFilterCount} advanced filter${advancedFilterCount === 1 ? "" : "s"} active`}
              >
                {advancedFilterCount}
              </span>
            ) : null}
            <ChevronDown
              className={cn(
                "ml-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                filtersExpanded && "rotate-180"
              )}
              aria-hidden
            />
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-10 rounded-full px-4"
            disabled={!hasActiveFilters}
            onClick={onClearAllFilters}
          >
            Clear all filters
          </Button>
        </div>

        <div
          id={advancedFiltersPanelId}
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-in-out",
            filtersExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div
            className="min-h-0 overflow-hidden"
            aria-hidden={!filtersExpanded}
            inert={filtersExpanded ? undefined : true}
          >
            <div className="pt-4">
              <ClassPlanFilterBar
                classTypeFilter={classTypeFilter}
                onClassTypeFilterChange={onClassTypeFilterChange}
                classStyleFilter={classStyleFilter}
                onClassStyleFilterChange={onClassStyleFilterChange}
                tagFilter={tagFilter}
                onTagFilterChange={onTagFilterChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
