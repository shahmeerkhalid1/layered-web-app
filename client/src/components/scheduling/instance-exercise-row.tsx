"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { PlanSectionExerciseRow } from "@/lib/types";
import { schedulingApi } from "@/services/scheduling-api";
import { ClassPlanExerciseProgrammingSummary } from "@/components/class-plans/class-plan-exercise-programming-summary";
import { ExercisePlanPreview } from "@/components/class-plans/exercise-plan-preview";
import { SectionExerciseFields } from "@/components/class-plans/section-exercise-fields";
import { Button } from "@/components/ui/button";
import type { SectionExerciseField } from "@/lib/validation/section-exercise-fields-schema";

interface InstanceExerciseRowProps {
  instanceId: string;
  sectionId: string;
  row: PlanSectionExerciseRow;
  disabled?: boolean;
  onUpdated: () => void | Promise<void>;
}

export function InstanceExerciseRow({
  instanceId,
  sectionId,
  row,
  disabled = false,
  onUpdated,
}: InstanceExerciseRowProps) {
  const [pending, setPending] = useState(false);

  const patchField = async (field: SectionExerciseField, value: string | null) => {
    await schedulingApi.updateInstanceSectionExercise(instanceId, sectionId, row.id, {
      [field]: value,
    });
    await onUpdated();
  };

  return (
    <li className="rounded-2xl border border-border/80 bg-background/60 p-3 md:p-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="font-medium leading-snug text-foreground">{row.exercise.name}</p>
            <ClassPlanExerciseProgrammingSummary exercise={row.exercise} />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full text-destructive hover:text-destructive"
            disabled={disabled || pending}
            onClick={async () => {
              setPending(true);
              try {
                await schedulingApi.removeInstanceSectionExercise(instanceId, sectionId, row.id);
                toast.success("Removed from plan");
                await onUpdated();
              } catch {
                toast.error("Failed to remove");
              } finally {
                setPending(false);
              }
            }}
          >
            Remove
          </Button>
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
  );
}
