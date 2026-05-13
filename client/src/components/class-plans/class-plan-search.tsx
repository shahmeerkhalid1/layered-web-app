"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
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

interface ClassPlanSearchProps {
  value: string;
  onChange: (value: string) => void;
  classTypeFilter: string;
  onClassTypeFilterChange: (value: string) => void;
  classStyleFilter: string;
  onClassStyleFilterChange: (value: string) => void;
  tagFilter: string | null;
  onTagFilterChange: (value: string | null) => void;
}

export function ClassPlanSearch({
  value,
  onChange,
  classTypeFilter,
  onClassTypeFilterChange,
  classStyleFilter,
  onClassStyleFilterChange,
  tagFilter,
  onTagFilterChange,
}: ClassPlanSearchProps) {
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
    <div className="space-y-4">
      <div className="relative rounded-2xl border border-border bg-card shadow-md">
        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by plan name…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 rounded-2xl border-0 bg-transparent pr-11 pl-11 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            type="button"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-md sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[10rem] flex-1 space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Class type</Label>
          <Select
            value={classTypeFilter || "all"}
            onValueChange={(v) => onClassTypeFilterChange(v === "all" ? "" : (v ?? ""))}
            disabled={classTypeDd.loading && classTypeDd.options.length === 0}
          >
            <SelectTrigger className="box-border h-11 w-full min-w-0 justify-between rounded-2xl border-input bg-background/80 px-3 shadow-none focus-visible:ring-ring/35">
              <SelectValue>
                <span
                  className={cn(
                    !classTypeFilter || classTypeDd.loading
                      ? "text-muted-foreground"
                      : undefined
                  )}
                >
                  {classTypeLabel}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              align="start"
              sideOffset={6}
              className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg"
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

        <div className="min-w-[10rem] flex-1 space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Class style</Label>
          <Select
            value={classStyleFilter || "all"}
            onValueChange={(v) => onClassStyleFilterChange(v === "all" ? "" : (v ?? ""))}
            disabled={classStyleDd.loading && classStyleDd.options.length === 0}
          >
            <SelectTrigger className="box-border h-11 w-full min-w-0 justify-between rounded-2xl border-input bg-background/80 px-3 shadow-none focus-visible:ring-ring/35">
              <SelectValue>
                <span
                  className={cn(
                    !classStyleFilter || classStyleDd.loading
                      ? "text-muted-foreground"
                      : undefined
                  )}
                >
                  {classStyleLabel}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              align="start"
              sideOffset={6}
              className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg"
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

        <div className="min-w-0 flex-[2] space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Tags</Label>
          <div className="flex flex-wrap gap-1.5">
            {TAG_PRESETS.map((tag) => {
              const active = tagFilter === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagFilterChange(active ? null : tag)}
                  className={cn(
                    "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium transition-colors",
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
                className="inline-flex h-7 items-center rounded-full border border-transparent bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                {tagFilter} ×
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
