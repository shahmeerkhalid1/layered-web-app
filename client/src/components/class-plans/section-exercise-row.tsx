"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { PlanSectionExerciseRow } from "@/lib/types";
import { classPlanApi } from "@/services/class-plan-api";
import { ClassPlanExerciseProgrammingSummary } from "@/components/class-plans/class-plan-exercise-programming-summary";
import { ExercisePlanPreview } from "@/components/class-plans/exercise-plan-preview";
import { SectionExerciseFields } from "@/components/class-plans/section-exercise-fields";
import { EditClassPlanExerciseDialog } from "@/components/class-plans/edit-class-plan-exercise-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SectionExerciseField } from "@/lib/validation/section-exercise-fields-schema";

export interface SectionExerciseRowProps {
  templateId: string;
  sectionId: string;
  row: PlanSectionExerciseRow;
  classPlanClassType?: string | null;
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
  classPlanClassType,
  disabled = false,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onUpdated,
}: SectionExerciseRowProps) {
  const [removeOpen, setRemoveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const patchField = async (field: SectionExerciseField, value: string | null) => {
    await classPlanApi.updateSectionExercise(templateId, sectionId, row.id, {
      [field]: value,
    });
    await onUpdated();
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
        <div className="mt-3 max-w-full">
          <ExercisePlanPreview exercise={row.exercise} previewId={row.id} />
        </div>

        <div className="mt-3">
          <SectionExerciseFields
            row={row}
            disabled={disabled || pending}
            variant="template"
            onPatchField={patchField}
          />
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
                ? "The exercise will be removed from this section only."
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
        classPlanClassType={classPlanClassType}
        onSaved={onUpdated}
      />
    </>
  );
}
