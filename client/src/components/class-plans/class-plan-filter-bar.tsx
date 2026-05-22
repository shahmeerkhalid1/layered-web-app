"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDropdownOptions } from "@/hooks/use-dropdown-options";
import type { DropdownOptionRow } from "@/lib/types";
import { FILTER_SELECT_EMPTY_VALUES } from "@/lib/form-control-styles";
import { cn } from "@/lib/utils";

const TAG_PRESETS = ["Easy Teach", "Moderate", "Challenging"] as const;

function selectLabel(
  value: string,
  placeholder: string,
  options: DropdownOptionRow[],
  loading: boolean
): string {
  if (loading && options.length === 0) return "Loading…";
  if (value === "" || value === "all") return placeholder;
  const found = options.find((o) => o.value === value);
  return found?.label ?? value;
}

export interface ClassPlanFilterBarProps {
  classTypeFilter: string;
  onClassTypeFilterChange: (value: string) => void;
  classStyleFilter: string;
  onClassStyleFilterChange: (value: string) => void;
  tagFilter: string | null;
  onTagFilterChange: (value: string | null) => void;
}

export function ClassPlanFilterBar({
  classTypeFilter,
  onClassTypeFilterChange,
  classStyleFilter,
  onClassStyleFilterChange,
  tagFilter,
  onTagFilterChange,
}: ClassPlanFilterBarProps) {
  const classTypeDd = useDropdownOptions("class_type");
  const classStyleDd = useDropdownOptions("class_style");

  const classTypeLabel = selectLabel(
    classTypeFilter,
    "All types",
    classTypeDd.options,
    classTypeDd.loading
  );
  const classStyleLabel = selectLabel(
    classStyleFilter,
    "All styles",
    classStyleDd.options,
    classStyleDd.loading
  );

  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
      <div className="min-w-40 flex-1 space-y-2">
        <Label htmlFor="class-plan-filter-type" className="text-muted-foreground">
          Class type
        </Label>
        <Select
          value={classTypeFilter || "all"}
          emptyValues={FILTER_SELECT_EMPTY_VALUES}
          onValueChange={(v) => onClassTypeFilterChange(v === "all" ? "" : (v ?? ""))}
          disabled={classTypeDd.loading && classTypeDd.options.length === 0}
        >
          <SelectTrigger
            id="class-plan-filter-type"
            className="h-12 w-full min-w-0 rounded-2xl border-input bg-background/70 px-4 shadow-none focus-visible:ring-ring/35 data-placeholder:text-muted-foreground"
          >
            <SelectValue>
              <span
                className={cn(
                  !classTypeFilter || classTypeDd.loading ? "text-muted-foreground" : undefined
                )}
              >
                {classTypeLabel}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            align="start"
            sideOffset={6}
            className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
          >
            <SelectItem value="all" className="rounded-xl py-2.5 pl-3">
              <span className="text-muted-foreground">All types</span>
            </SelectItem>
            {classTypeDd.options.map((o) => (
              <SelectItem key={o.id} value={o.value} className="rounded-xl py-2.5 pl-3">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-40 flex-1 space-y-2">
        <Label htmlFor="class-plan-filter-style" className="text-muted-foreground">
          Class style
        </Label>
        <Select
          value={classStyleFilter || "all"}
          emptyValues={FILTER_SELECT_EMPTY_VALUES}
          onValueChange={(v) => onClassStyleFilterChange(v === "all" ? "" : (v ?? ""))}
          disabled={classStyleDd.loading && classStyleDd.options.length === 0}
        >
          <SelectTrigger
            id="class-plan-filter-style"
            className="h-12 w-full min-w-0 rounded-2xl border-input bg-background/70 px-4 shadow-none focus-visible:ring-ring/35 data-placeholder:text-muted-foreground"
          >
            <SelectValue>
              <span
                className={cn(
                  !classStyleFilter || classStyleDd.loading ? "text-muted-foreground" : undefined
                )}
              >
                {classStyleLabel}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            align="start"
            sideOffset={6}
            className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
          >
            <SelectItem value="all" className="rounded-xl py-2.5 pl-3">
              <span className="text-muted-foreground">All styles</span>
            </SelectItem>
            {classStyleDd.options.map((o) => (
              <SelectItem key={o.id} value={o.value} className="rounded-xl py-2.5 pl-3">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 flex-2 space-y-2">
        <Label className="text-muted-foreground">Tags</Label>
        <div className="flex flex-wrap gap-1.5">
          {TAG_PRESETS.map((tag) => {
            const active = tagFilter === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagFilterChange(active ? null : tag)}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors",
                  active
                    ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border bg-muted/40 text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {tag}
              </button>
            );
          })}
          {tagFilter && !TAG_PRESETS.includes(tagFilter as (typeof TAG_PRESETS)[number]) && (
            <button
              type="button"
              onClick={() => onTagFilterChange(null)}
              className="inline-flex h-8 items-center rounded-full border border-transparent bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              {tagFilter} ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
