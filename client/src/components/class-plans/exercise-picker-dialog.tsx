"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Exercise } from "@/lib/types";
import { classPlanApi } from "@/services/class-plan-api";
import { exerciseApi } from "@/services/exercise-api";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { ExerciseSearch } from "@/components/exercises/exercise-search";
import { ClassPlanExerciseProgrammingSummary } from "@/components/class-plans/class-plan-exercise-programming-summary";
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

export interface ExercisePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  sectionId: string;
  onExerciseAdded: () => void | Promise<void>;
}

export function ExercisePickerDialog({
  open,
  onOpenChange,
  templateId,
  sectionId,
  onExerciseAdded,
}: ExercisePickerDialogProps) {
  const [tab, setTab] = useState("library");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

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
    if (!open) return;
    const t = window.setTimeout(() => {
      setTab("library");
      setSearch("");
      setFormKey((k) => k + 1);
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, sectionId]);

  const addFromLibrary = async (exerciseId: string) => {
    setAddingId(exerciseId);
    try {
      await classPlanApi.addExerciseToSection(templateId, sectionId, { exerciseId });
      toast.success("Exercise added to section");
      onOpenChange(false);
      await onExerciseAdded();
    } catch {
      toast.error("Could not add exercise");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(90vh,800px)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-3xl border-border p-0 shadow-xl sm:max-w-6xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em]">
            Add exercise to section
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Pick from your library or create a new exercise for this plan.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-4 pb-6 [-webkit-overflow-scrolling:touch]">
          <Tabs
            value={tab}
            onValueChange={(v) => v && setTab(v)}
            className="flex flex-col gap-0"
          >
            <TabsList className="mb-4 w-full max-w-xl mx-auto shrink-0">
              <TabsTrigger value="library" className="flex-1">
                Pick from library
              </TabsTrigger>
              <TabsTrigger value="create" className="flex-1">
                Create new
              </TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="mt-0">
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
                        const busy = addingId === ex.id;
                        return (
                          <li key={ex.id}>
                            <button
                              type="button"
                              disabled={busy || addingId !== null}
                              onClick={() => void addFromLibrary(ex.id)}
                              className={cn(
                                "w-full rounded-2xl border border-bottom bg-card p-3 text-left transition-colors",
                                "hover:border-border hover:ring-1 hover:ring-border hover:bg-card/90",
                                "disabled:pointer-events-none disabled:opacity-60"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-medium text-foreground">{ex.name}</span>
                                {busy && (
                                  <span className="text-xs text-muted-foreground">Adding…</span>
                                )}
                              </div>
                              <ClassPlanExerciseProgrammingSummary className="mt-2" exercise={ex} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="create" className="mt-0">
              <ExerciseForm
                key={formKey}
                embedInClassPlan
                onEmbedCancel={() => onOpenChange(false)}
                onEmbedCreateSuccess={async (created: Exercise) => {
                  try {
                    await classPlanApi.addExerciseToSection(templateId, sectionId, {
                      exerciseId: created.id,
                    });
                    toast.success("Exercise added to section");
                    onOpenChange(false);
                    await onExerciseAdded();
                  } catch {
                    toast.error("Exercise was created but could not be added to this section");
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
