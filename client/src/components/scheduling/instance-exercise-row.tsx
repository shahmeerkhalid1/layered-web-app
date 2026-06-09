"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import type { PlanSectionExerciseRow } from "@/lib/types";
import { schedulingApi } from "@/services/scheduling-api";
import { ClassPlanExerciseProgrammingSummary } from "@/components/class-plans/class-plan-exercise-programming-summary";
import { ExercisePlanPreview } from "@/components/class-plans/exercise-plan-preview";
import { SectionExerciseFields } from "@/components/class-plans/section-exercise-fields";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
import { Button } from "@/components/ui/button";
import type { SectionExerciseField } from "@/lib/validation/section-exercise-fields-schema";

interface InstanceExerciseRowProps {
  instanceId: string;
  sectionId: string;
  row: PlanSectionExerciseRow;
  disabled?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void | Promise<void>;
  onMoveDown: () => void | Promise<void>;
  onUpdated: () => void | Promise<void>;
}

export function InstanceExerciseRow({
  instanceId,
  sectionId,
  row,
  disabled = false,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onUpdated,
}: InstanceExerciseRowProps) {
  const [removeOpen, setRemoveOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const patchField = async (field: SectionExerciseField, value: string | null) => {
    await schedulingApi.updateInstanceSectionExercise(instanceId, sectionId, row.id, {
      [field]: value,
    });
    await onUpdated();
  };

  const confirmRemove = async () => {
    setPending(true);
    try {
      await schedulingApi.removeInstanceSectionExercise(instanceId, sectionId, row.id);
      toast.success("Removed from plan");
      setRemoveOpen(false);
      await onUpdated();
    } catch {
      toast.error("Failed to remove");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <li className="rounded-2xl border border-border/80 bg-background/60 p-3 md:p-4">
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="font-medium leading-snug text-foreground">{row.exercise.name}</p>
              <ClassPlanExerciseProgrammingSummary exercise={row.exercise} />
            </div>
            <div
              className="flex shrink-0 flex-wrap items-center gap-0.5 self-end sm:self-start"
              role="toolbar"
              aria-label={`Actions for ${row.exercise.name}`}
            >
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
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full text-destructive hover:text-destructive"
                disabled={disabled || pending}
                onClick={() => setRemoveOpen(true)}
              >
                Remove
              </Button>
            </div>
          </div>
          <div className="max-w-full">
            <ExercisePlanPreview exercise={row.exercise} previewId={row.id} />
          </div>
          <SectionExerciseFields
            row={row}
            disabled={disabled || pending}
            variant="instance"
            onPatchField={patchField}
          />
        </div>
      </li>

      <ConfirmDestructiveDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title="Remove exercise?"
        description={`“${row.exercise.name}” will be removed from this class plan only. The exercise stays in your library.`}
        confirmLabel="Remove"
        confirmPendingLabel="Removing…"
        pending={pending}
        onConfirm={confirmRemove}
      />
    </>
  );
}
