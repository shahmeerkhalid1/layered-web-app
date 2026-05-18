"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { PlanSectionExerciseRow } from "@/lib/types";
import { classPlanApi } from "@/services/class-plan-api";
import { ClassPlanExerciseProgrammingSummary } from "@/components/class-plans/class-plan-exercise-programming-summary";
import { EditClassPlanExerciseDialog } from "@/components/class-plans/edit-class-plan-exercise-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SectionExerciseRowProps {
  templateId: string;
  sectionId: string;
  row: PlanSectionExerciseRow;
  disabled?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void | Promise<void>;
  onMoveDown: () => void | Promise<void>;
  onUpdated: () => void | Promise<void>;
}

export function SectionExerciseRow({
  templateId,
  sectionId,
  row,
  disabled = false,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onUpdated,
}: SectionExerciseRowProps) {
  const [reps, setReps] = useState(row.reps ?? "");
  const [duration, setDuration] = useState(row.duration ?? "");
  const [notes, setNotes] = useState(row.notes ?? "");
  const [removeOpen, setRemoveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setReps(row.reps ?? "");
      setDuration(row.duration ?? "");
      setNotes(row.notes ?? "");
    }, 0);
    return () => window.clearTimeout(t);
  }, [row.id, row.reps, row.duration, row.notes]);

  const norm = (s: string) => (s.trim() === "" ? null : s.trim());
  const serverReps = row.reps ?? null;
  const serverDuration = row.duration ?? null;
  const serverNotes = row.notes ?? null;

  const patchField = async (
    field: "reps" | "duration" | "notes",
    raw: string
  ) => {
    const next = norm(raw);
    const prev =
      field === "reps" ? serverReps : field === "duration" ? serverDuration : serverNotes;
    if (next === prev) return;
    setPending(true);
    try {
      await classPlanApi.updateSectionExercise(templateId, sectionId, row.id, {
        [field]: next,
      });
      await onUpdated();
    } catch {
      toast.error("Could not save changes");
    } finally {
      setPending(false);
    }
  };

  const isDraftExercise = row.exercise.savedToLibrary === false;

  const confirmRemove = async () => {
    setPending(true);
    try {
      await classPlanApi.removeSectionExercise(templateId, sectionId, row.id);
      toast.success("Exercise removed from section");
      setRemoveOpen(false);
      await onUpdated();
    } catch {
      toast.error("Failed to remove exercise");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <li className="rounded-2xl border border-border/80 bg-background/60 p-3 md:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="font-medium leading-snug text-foreground">{row.exercise.name}</p>
            <ClassPlanExerciseProgrammingSummary exercise={row.exercise} />
          </div>
          <div
            className="flex shrink-0 flex-wrap items-center gap-0.5 self-end sm:self-start"
            role="toolbar"
            aria-label={`Actions for ${row.exercise.name}`}
          >
            {isDraftExercise && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                disabled={disabled || pending}
                aria-label={`Edit ${row.exercise.name} (not in library yet)`}
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-4" aria-hidden />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              disabled={disabled || pending || !canMoveUp}
              aria-label="Move exercise up"
              onClick={() => void onMoveUp()}
            >
              <ArrowUp className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              disabled={disabled || pending || !canMoveDown}
              aria-label="Move exercise down"
              onClick={() => void onMoveDown()}
            >
              <ArrowDown className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              disabled={disabled || pending}
              aria-label="Remove exercise from section"
              onClick={() => setRemoveOpen(true)}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`reps-${row.id}`} className="text-xs text-muted-foreground">
              Reps
            </Label>
            <Input
              id={`reps-${row.id}`}
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              onBlur={() => void patchField("reps", reps)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              disabled={disabled || pending}
              className="h-9 rounded-xl text-sm"
              placeholder="—"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`dur-${row.id}`} className="text-xs text-muted-foreground">
              Duration
            </Label>
            <Input
              id={`dur-${row.id}`}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onBlur={() => void patchField("duration", duration)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              disabled={disabled || pending}
              className="h-9 rounded-xl text-sm"
              placeholder="—"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor={`notes-${row.id}`} className="text-xs text-muted-foreground">
              Notes
            </Label>
            <Input
              id={`notes-${row.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => void patchField("notes", notes)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              disabled={disabled || pending}
              className="h-9 rounded-xl text-sm"
              placeholder="—"
            />
          </div>
        </div>
      </li>

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent className="rounded-3xl border-border bg-popover p-6 shadow-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em]">
              Remove exercise?
            </DialogTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              “{row.exercise.name}” will be removed from this section only.{" "}
              {isDraftExercise
                ? "You can still edit it from this plan until you remove or delete the exercise."
                : "The exercise stays in your library."}
            </p>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setRemoveOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              disabled={pending}
              onClick={() => void confirmRemove()}
            >
              {pending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditClassPlanExerciseDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        exerciseId={editOpen && isDraftExercise ? row.exercise.id : null}
        onSaved={onUpdated}
      />
    </>
  );
}
