"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Exercise } from "@/lib/types";
import { classPlanApi } from "@/services/class-plan-api";
import { exerciseApi } from "@/services/exercise-api";
import { schedulingApi } from "@/services/scheduling-api";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { ExerciseSearch } from "@/components/exercises/exercise-search";
import { ClassPlanExerciseProgrammingSummary } from "@/components/class-plans/class-plan-exercise-programming-summary";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

const PANEL_MOUNT_DELAY_MS = 100;

function ExercisePickerPanelPlaceholder() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
type ExercisePickerDialogBaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  onExerciseAdded: () => void | Promise<void>;
  /** Template `classType` — forwarded to embedded exercise create form. */
  classPlanClassType?: string | null;
};

export type ExercisePickerDialogProps = ExercisePickerDialogBaseProps &
  (
    | { mode: "template"; templateId: string }
    | { mode: "instance"; instanceId: string }
  );

export function ExercisePickerDialog(props: ExercisePickerDialogProps) {
  const { open, onOpenChange, sectionId, onExerciseAdded, classPlanClassType } = props;
  const [tab, setTab] = useState("create");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [panelReady, setPanelReady] = useState(false);
  const [formInstanceKey, setFormInstanceKey] = useState(0);

  const addExerciseToSection = async (exerciseId: string) => {
    if (props.mode === "template") {
      await classPlanApi.addExerciseToSection(props.templateId, sectionId, { exerciseId });
    } else {
      await schedulingApi.addInstanceSectionExercise(props.instanceId, sectionId, { exerciseId });
    }
  };

  const loadLibrary = useCallback(
    async (signal?: AbortSignal) => {
      setLoadingLibrary(true);
      try {
        const data = await exerciseApi.getExercises(
          {
            search: debouncedSearch.trim() || undefined,
            savedToLibrary: true,
          },
          signal
        );
        setLibrary(data);
      } catch {
        if (!signal?.aborted) toast.error("Failed to load exercises");
      } finally {
        if (!signal?.aborted) setLoadingLibrary(false);
      }
    },
    [debouncedSearch]
  );

  useEffect(() => {
    if (!open || tab !== "library") return;
    const ac = new AbortController();
    const t = window.setTimeout(() => {
      void loadLibrary(ac.signal);
    }, 0);
    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [open, tab, loadLibrary]);

  useEffect(() => {
    if (!open) {
      const t = window.setTimeout(() => {
        setTab("create");
        setSearch("");
        setSelectedIds(new Set());
        setPanelReady(false);
      }, 0);
      return () => window.clearTimeout(t);
    }

    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      setFormInstanceKey((k) => k + 1);
      setPanelReady(true);
    }, PANEL_MOUNT_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      setPanelReady(false);
    };
  }, [open, sectionId]);

  const toggleSelected = (exerciseId: string) => {
    if (isAdding) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  };

  const addSelectedFromLibrary = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    setIsAdding(true);
    let added = 0;
    try {
      for (const exerciseId of ids) {
        await addExerciseToSection(exerciseId);
        added += 1;
      }
      toast.success(
        added === 1 ? "Exercise added to section" : `${added} exercises added to section`
      );
      onOpenChange(false);
      await onExerciseAdded();
    } catch {
      if (added > 0) {
        toast.error(
          `Added ${added} of ${ids.length} exercises. Try again for the rest.`
        );
        setSelectedIds(new Set(ids.slice(added)));
        await onExerciseAdded();
      } else {
        toast.error("Could not add exercises");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const selectedCount = selectedIds.size;
  const showLibraryFooter = tab === "library" && !loadingLibrary && library.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(90vh,800px)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-3xl border-border p-0 shadow-xl sm:max-w-6xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em]">
            Add exercise to section
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a new exercise or pick from your library for this plan.
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-4 [-webkit-overflow-scrolling:touch]",
            showLibraryFooter ? "pb-4" : "pb-6"
          )}
        >
          <Tabs
            value={tab}
            onValueChange={(v) => v && setTab(v)}
            className="flex flex-col gap-0"
          >
            <TabsList className="mb-4 w-full max-w-xl mx-auto shrink-0">
              <TabsTrigger value="create" className={`flex-1 ${tab === "create" ? "bg-primary!" : ""}`}>
                Create new
              </TabsTrigger>
              <TabsTrigger value="library" className={`flex-1 ${tab === "library" ? "bg-primary!" : ""}`}>
                Pick from library
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-0">
              {!panelReady ? (
                <ExercisePickerPanelPlaceholder />
              ) : (
                <ExerciseForm
                  key={formInstanceKey}
                  embedInClassPlan
                  classPlanClassType={classPlanClassType}
                  onEmbedCancel={() => onOpenChange(false)}
                  onEmbedCreateSuccess={async (created: Exercise) => {
                    try {
                      await addExerciseToSection(created.id);
                      toast.success("Exercise added to section");
                      onOpenChange(false);
                      await onExerciseAdded();
                    } catch {
                      toast.error("Exercise was created but could not be added to this section");
                    }
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="library" className="mt-0">
              {tab === "library" ? (
                <div className="flex flex-col gap-3">
                <div className="shrink-0 p-2 w-full max-w-full">
                  <ExerciseSearch
                    id="exercise-picker-search"
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by name or description…"
                  />
                </div>
                <div className="rounded-2xl bg-muted/15 p-2">
                  {loadingLibrary ? (
                    <div className="flex justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : library.length === 0 ? (
                    <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                      {debouncedSearch.trim()
                        ? "No exercises match your search."
                        : "No exercises in your library yet."}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {library.map((ex) => {
                        const selected = selectedIds.has(ex.id);
                        return (
                          <li key={ex.id}>
                            <div
                              role="button"
                              tabIndex={isAdding ? -1 : 0}
                              aria-pressed={selected}
                              aria-disabled={isAdding}
                              onClick={() => toggleSelected(ex.id)}
                              onKeyDown={(e) => {
                                if (isAdding) return;
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  toggleSelected(ex.id);
                                }
                              }}
                              className={cn(
                                "flex w-full cursor-pointer gap-3 rounded-2xl border bg-card p-3 text-left transition-colors",
                                selected
                                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                                  : "border-border hover:border-border hover:bg-card/90 hover:ring-1 hover:ring-border",
                                isAdding && "pointer-events-none opacity-60"
                              )}
                            >
                              <Checkbox
                                checked={selected}
                                disabled={isAdding}
                                aria-label={`Select ${ex.name}`}
                                className="mt-0.5"
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => toggleSelected(ex.id)}
                              />
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-foreground">{ex.name}</span>
                                <ClassPlanExerciseProgrammingSummary
                                  className="mt-2"
                                  exercise={ex}
                                />
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>

        {showLibraryFooter ? (
          <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {selectedCount === 0
                ? "Select one or more exercises"
                : selectedCount === 1
                  ? "1 exercise selected"
                  : `${selectedCount} exercises selected`}
            </p>
            <Button
              type="button"
              disabled={selectedCount === 0 || isAdding}
              onClick={() => void addSelectedFromLibrary()}
            >
              {isAdding
                ? "Adding…"
                : selectedCount > 1
                  ? `Add ${selectedCount} to section`
                  : "Add to section"}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
