"use client";

import { useId, useMemo, useState } from "react";
import {
  ChevronDown,
  FolderPlus,
  ListFilter,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { ClassPlanFolder } from "@/lib/types";
import { ClassPlanFilterBar } from "@/components/class-plans/class-plan-filter-bar";
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
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onEditFolder: (folder: ClassPlanFolder) => void;
  onRequestDeleteFolder: (folder: ClassPlanFolder) => void;
  classTypeFilter: string;
  onClassTypeFilterChange: (value: string) => void;
  classStyleFilter: string;
  onClassStyleFilterChange: (value: string) => void;
  tagFilter: string | null;
  onTagFilterChange: (value: string | null) => void;
  onClearAllFilters: () => void;
  createDisabled?: boolean;
  createDisabledTitle?: string;
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
  onRequestDeleteFolder,
  classTypeFilter,
  onClassTypeFilterChange,
  classStyleFilter,
  onClassStyleFilterChange,
  tagFilter,
  onTagFilterChange,
  onClearAllFilters,
  createDisabled = false,
  createDisabledTitle = "Upgrade to create more class plans",
}: ClassPlanLibraryHeaderProps) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const advancedFiltersPanelId = useId();

  const totalKnown = totalPlans !== undefined;
  const total = totalPlans ?? 0;

  const hasAdvancedFilters =
    classTypeFilter.length > 0 ||
    classStyleFilter.length > 0 ||
    tagFilter !== null;

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
    [folders, selectedFolder],
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

  const subtitle = totalKnown
    ? hasActiveFilters
      ? `Showing ${visiblePlanCount} of ${total} plan${total === 1 ? "" : "s"} · ${folderCount} folder${folderCount === 1 ? "" : "s"}`
      : `${total} plan${total === 1 ? "" : "s"} · ${folderCount} folder${folderCount === 1 ? "" : "s"}`
    : loading
      ? "Loading library…"
      : "0 plans · 0 folders";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between ">
        <header className="space-y-2">
          <p className="layered-eyebrow">Class plans</p>
          <h1 className="layered-display-headline">Class plans</h1>
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
          <button
            type="button"
            onClick={createDisabled ? undefined : onNewPlan}
            disabled={createDisabled}
            title={createDisabled ? createDisabledTitle : undefined}
            className={cn(
              buttonVariants({ variant: "default" }),
              "inline-flex h-10 items-center justify-center rounded bg-primary px-5 text-primary-foreground shadow-none hover:bg-primary/90",
              createDisabled && "pointer-events-none opacity-50",
            )}
          >
            <Plus className="mr-2 size-4" />
            New plan
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[260px] flex-1">
          <ExerciseSearch
            id="class-plan-library-search"
            value={search}
            onChange={onSearchChange}
            placeholder="Search by plan name…"
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
              id="class-plan-library-folder"
              className="h-10 w-full min-w-[180px] rounded border-border bg-card px-3 shadow-none"
            >
              <SelectValue placeholder="All plans">{folderSelectLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start" sideOffset={6} className="rounded border-border p-1">
              <SelectItem value="all" className="rounded py-2 pl-3">
                {totalTemplateCount !== undefined ? (
                  <span>All plans ({totalTemplateCount})</span>
                ) : (
                  <span>All plans</span>
                )}
              </SelectItem>
              <SelectItem value="none" className="rounded py-2 pl-3">
                <span>Unorganized</span>
              </SelectItem>
              {folders.length > 0 && (
                <>
                  <SelectSeparator />
                  {folders.map((f) => {
                    const n = f._count?.templates;
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

        <Button
          type="button"
          variant="outline"
          className="h-10 rounded border border-[var(--layered-black)] px-4 shadow-none"
          aria-expanded={filtersExpanded}
          aria-controls={advancedFiltersPanelId}
          onClick={() => setFiltersExpanded((open) => !open)}
        >
          <ListFilter className="mr-2 size-4 shrink-0" />
          Filters
          {hasAdvancedFilters ? (
            <span
              className="ml-2 inline-flex min-w-5 justify-center rounded bg-muted px-1.5 text-xs font-medium tabular-nums"
              aria-label={`${advancedFilterCount} advanced filter${advancedFilterCount === 1 ? "" : "s"} active`}
            >
              {advancedFilterCount}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "ml-1 size-4 shrink-0 text-muted-foreground transition-transform duration-150",
              filtersExpanded && "rotate-180",
            )}
            aria-hidden
          />
        </Button>

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

      <div
        id={advancedFiltersPanelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-150 ease-out",
          filtersExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div
          className="min-h-0 overflow-hidden"
          aria-hidden={!filtersExpanded}
          inert={filtersExpanded ? undefined : true}
        >
          <div className="pb-1">
            <ClassPlanFilterBar
              classTypeFilter={classTypeFilter}
              onClassTypeFilterChange={onClassTypeFilterChange}
              classStyleFilter={classStyleFilter}
              onClassStyleFilterChange={onClassStyleFilterChange}
              tagFilter={tagFilter}
              onTagFilterChange={onTagFilterChange}
            />
            {hasActiveFilters ? (
              <Button
                type="button"
                className="mt-3 h-9 rounded px-3 text-sm"
                onClick={onClearAllFilters}
              >
                Clear all filters
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
