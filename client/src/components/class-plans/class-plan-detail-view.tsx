"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarPlus,
  ChevronLeft,
  Layers,
  Pencil,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { ClassPlanFolder, ClassPlanTemplateDetail, PlanSectionDetail, PlanSectionExerciseRow } from "@/lib/types";
import { classPlanApi } from "@/services/class-plan-api";
import { EditClassPlanDialog } from "@/components/class-plans/edit-class-plan-dialog";
import { ExercisePickerDialog } from "@/components/class-plans/exercise-picker-dialog";
import { QuickScheduleDialog } from "@/components/scheduling/quick-schedule-dialog";
import { SectionExerciseRow } from "@/components/class-plans/section-exercise-row";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function sortSections(sections: PlanSectionDetail[]): PlanSectionDetail[] {
  return [...sections].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.id.localeCompare(b.id);
  });
}

function sortSectionExercises(rows: PlanSectionExerciseRow[]): PlanSectionExerciseRow[] {
  return [...rows].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.id.localeCompare(b.id);
  });
}

interface ClassPlanDetailViewProps {
  planId: string;
}

export function ClassPlanDetailView({ planId }: ClassPlanDetailViewProps) {
  const [plan, setPlan] = useState<ClassPlanTemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<PlanSectionDetail | null>(null);
  const [editSectionName, setEditSectionName] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingSection, setDeletingSection] = useState<PlanSectionDetail | null>(null);

  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [folders, setFolders] = useState<ClassPlanFolder[]>([]);
  const [pickerSectionId, setPickerSectionId] = useState<string | null>(null);

  const fetchPlan = useCallback(
    async (signal?: AbortSignal) => {
      const data = await classPlanApi.getClassPlanById(planId, signal);
      setPlan(data);
      setError(null);
    },
    [planId]
  );

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      fetchPlan(ac.signal)
        .catch((err: unknown) => {
          if (cancelled || ac.signal.aborted) return;
          const aborted =
            err instanceof DOMException
              ? err.name === "AbortError"
              : typeof err === "object" &&
                err !== null &&
                "name" in err &&
                (err as { name?: string }).name === "AbortError";
          if (aborted) return;
          setError("Could not load this class plan.");
          setPlan(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      ac.abort();
    };
  }, [planId, fetchPlan]);

  useEffect(() => {
    let cancelled = false;
    classPlanApi
      .getFolders()
      .then((res) => {
        if (!cancelled) setFolders(res.folders);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load folders");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedSections = useMemo(
    () => (plan?.sections ? sortSections(plan.sections) : []),
    [plan]
  );

  const refreshAfterMutation = async () => {
    try {
      await fetchPlan();
    } catch {
      toast.error("Saved, but the plan could not be refreshed. Try reloading the page.");
    }
  };

  const openAdd = () => {
    setNewSectionName("");
    setAddOpen(true);
  };

  const submitAdd = async () => {
    const name = newSectionName.trim();
    if (!name) {
      toast.error("Section name is required");
      return;
    }
    setPending(true);
    try {
      await classPlanApi.addSection(planId, { name });
      toast.success("Section added");
      setAddOpen(false);
      await refreshAfterMutation();
    } catch {
      toast.error("Failed to add section");
    } finally {
      setPending(false);
    }
  };

  const openEdit = (section: PlanSectionDetail) => {
    setEditingSection(section);
    setEditSectionName(section.name);
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editingSection) return;
    const name = editSectionName.trim();
    if (!name) {
      toast.error("Section name is required");
      return;
    }
    setPending(true);
    try {
      await classPlanApi.updateSection(planId, editingSection.id, { name });
      toast.success("Section updated");
      setEditOpen(false);
      setEditingSection(null);
      await refreshAfterMutation();
    } catch {
      toast.error("Failed to update section");
    } finally {
      setPending(false);
    }
  };

  const openDelete = (section: PlanSectionDetail) => {
    setDeletingSection(section);
    setDeleteOpen(true);
  };

  const submitDelete = async () => {
    if (!deletingSection) return;
    setPending(true);
    try {
      await classPlanApi.deleteSection(planId, deletingSection.id);
      toast.success("Section removed");
      setDeleteOpen(false);
      setDeletingSection(null);
      await refreshAfterMutation();
    } catch {
      toast.error("Failed to delete section");
    } finally {
      setPending(false);
    }
  };

  const moveSection = async (sectionId: string, direction: "up" | "down") => {
    if (!plan) return;
    const sorted = sortSections(plan.sections);
    const idx = sorted.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    const curr = sorted[idx];
    const other = sorted[swapWith];
    const currOrder = curr.order;
    const otherOrder = other.order;
    setPending(true);
    try {
      await classPlanApi.updateSection(planId, curr.id, { order: otherOrder });
      await classPlanApi.updateSection(planId, other.id, { order: currOrder });
      await refreshAfterMutation();
    } catch {
      toast.error("Could not reorder sections");
    } finally {
      setPending(false);
    }
  };

  const moveExerciseInSection = async (
    sectionId: string,
    exerciseRowId: string,
    direction: "up" | "down"
  ) => {
    if (!plan) return;
    const section = plan.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const sorted = sortSectionExercises(section.exercises ?? []);
    const idx = sorted.findIndex((r) => r.id === exerciseRowId);
    if (idx < 0) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    const curr = sorted[idx];
    const other = sorted[swapWith];
    setPending(true);
    try {
      await classPlanApi.updateSectionExercise(planId, sectionId, curr.id, {
        order: other.order,
      });
      await classPlanApi.updateSectionExercise(planId, sectionId, other.id, {
        order: curr.order,
      });
      await refreshAfterMutation();
    } catch {
      toast.error("Could not reorder exercises");
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 rounded-3xl border border-border bg-card p-8 shadow-lg">
        <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
        <div className="h-9 w-3/4 max-w-md animate-pulse rounded-lg bg-muted" />
        <div className="h-20 animate-pulse rounded-2xl bg-muted/80" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="space-y-6 rounded-3xl border border-border bg-card p-8 shadow-lg">
        <p className="text-sm text-destructive">{error ?? "Plan not found."}</p>
        <Link
          href="/class-plans"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex rounded-full")}
        >
          <ChevronLeft className="mr-1 size-4" aria-hidden />
          Back to class plans
        </Link>
      </div>
    );
  }

  const durationLabel =
    plan.durationMinutes != null ? `${plan.durationMinutes} min` : "—";

  return (
    <div className="space-y-6">
      <QuickScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        templatePrefill={{
          id: plan.id,
          name: plan.name,
          durationMinutes: plan.durationMinutes,
        }}
      />
      <div className="rounded-3xl border border-border bg-card p-6 shadow-lg md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              Class planner
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-card-foreground md:text-3xl">
              {plan.name}
            </h1>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {plan.classType && (
                <Badge variant="outline" className="text-[11px] font-medium">
                  {plan.classType}
                </Badge>
              )}
              {plan.classStyle && (
                <Badge variant="outline" className="text-[11px] font-medium">
                  {plan.classStyle}
                </Badge>
              )}
              <Badge variant="secondary" className="text-[11px] font-medium tabular-nums">
                {durationLabel}
              </Badge>
              <Badge variant="secondary" className="text-[11px] font-medium tabular-nums">
                {sortedSections.length} section{sortedSections.length === 1 ? "" : "s"}
              </Badge>
            </div>
            {plan.folder && (
              <p className="text-xs text-muted-foreground">Folder: {plan.folder.name}</p>
            )}
            {plan.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {plan.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[11px] font-medium">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-full"
              onClick={() => setScheduleOpen(true)}
              disabled={pending}
            >
              <CalendarPlus className="mr-1 size-4" aria-hidden />
              Schedule this plan
            </Button>
            <Link
              href="/class-plans"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full border-border"
              )}
            >
              <ChevronLeft className="mr-1 size-4" aria-hidden />
              Class plans
            </Link>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full border-border"
              onClick={() => setEditPlanOpen(true)}
              disabled={pending}
            >
              <Settings2 className="mr-1 size-4" aria-hidden />
              Edit plan
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-full"
              onClick={openAdd}
              disabled={pending}
            >
              <Plus className="mr-1 size-4" aria-hidden />
              Add section
            </Button>
          </div>
        </div>
      </div>

      {sortedSections.length === 0 ? (
        <Card className="border-dashed border-border bg-muted/20 shadow-none">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Layers className="size-12 text-muted-foreground/60" aria-hidden />
            <div className="space-y-1">
              <p className="font-medium text-foreground">No sections yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Sections group exercises in your template. Add one to start building the plan
                structure.
              </p>
            </div>
            <Button type="button" className="rounded-full" onClick={openAdd} disabled={pending}>
              <Plus className="mr-1 size-4" aria-hidden />
              Add first section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {sortedSections.map((section, index) => {
            const exSorted = sortSectionExercises(section.exercises ?? []);
            return (
              <li key={section.id}>
                <Card className="overflow-hidden border-border shadow-md py-0">
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 border-b border-border/60 bg-muted/25 px-4 py-5 md:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Section {index + 1}
                        <span className="mx-1.5 text-border">·</span>
                        Order {section.order}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-card-foreground">
                        {section.name}
                      </h2>
                    </div>
                    <div
                      className="flex shrink-0 flex-wrap items-center gap-0.5"
                      role="toolbar"
                      aria-label={`Actions for ${section.name}`}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-foreground"
                        disabled={pending || index === 0}
                        aria-label="Move section up"
                        onClick={() => void moveSection(section.id, "up")}
                      >
                        <ArrowUp className="size-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-foreground"
                        disabled={pending || index === sortedSections.length - 1}
                        aria-label="Move section down"
                        onClick={() => void moveSection(section.id, "down")}
                      >
                        <ArrowDown className="size-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Rename section"
                        disabled={pending}
                        onClick={() => openEdit(section)}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete section"
                        disabled={pending}
                        onClick={() => openDelete(section)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 px-4 py-4 md:px-5">
                    {exSorted.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No exercises in this section yet. Add from your library or create a new
                        exercise.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {exSorted.map((row, exIndex) => (
                          <SectionExerciseRow
                            key={row.id}
                            templateId={planId}
                            sectionId={section.id}
                            row={row}
                            disabled={pending}
                            canMoveUp={exIndex > 0}
                            canMoveDown={exIndex < exSorted.length - 1}
                            onMoveUp={() =>
                              void moveExerciseInSection(section.id, row.id, "up")
                            }
                            onMoveDown={() =>
                              void moveExerciseInSection(section.id, row.id, "down")
                            }
                            onUpdated={() => void refreshAfterMutation()}
                          />
                        ))}
                      </ul>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-dashed border-border"
                      disabled={pending}
                      onClick={() => setPickerSectionId(section.id)}
                    >
                      <Plus className="mr-1 size-4" aria-hidden />
                      Add exercise
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-3xl border-border bg-popover p-6 shadow-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em]">
              New section
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-section-name">Name</Label>
            <Input
              id="new-section-name"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="e.g. Warm-up, Flow, Stretch"
              className="rounded-2xl"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submitAdd();
                }
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setAddOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={pending || !newSectionName.trim()}
              onClick={() => void submitAdd()}
            >
              {pending ? "Saving…" : "Add section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-3xl border-border bg-popover p-6 shadow-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em]">
              Rename section
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="edit-section-name">Name</Label>
            <Input
              id="edit-section-name"
              value={editSectionName}
              onChange={(e) => setEditSectionName(e.target.value)}
              className="rounded-2xl"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submitEdit();
                }
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setEditOpen(false);
                setEditingSection(null);
              }}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={pending || !editSectionName.trim()}
              onClick={() => void submitEdit()}
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-3xl border-border bg-popover p-6 shadow-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em]">
              Delete section?
            </DialogTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              {deletingSection
                ? `“${deletingSection.name}” and all exercise slots in it will be removed.`
                : "This section will be removed."}
            </p>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setDeleteOpen(false);
                setDeletingSection(null);
              }}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              disabled={pending || !deletingSection}
              onClick={() => void submitDelete()}
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditClassPlanDialog
        open={editPlanOpen}
        onOpenChange={setEditPlanOpen}
        plan={plan}
        folders={folders}
        onSaved={() => void refreshAfterMutation()}
      />

      <ExercisePickerDialog
        open={pickerSectionId !== null}
        onOpenChange={(open) => {
          if (!open) setPickerSectionId(null);
        }}
        mode="template"
        templateId={planId}
        sectionId={pickerSectionId ?? ""}
        onExerciseAdded={() => void refreshAfterMutation()}
      />
    </div>
  );
}
