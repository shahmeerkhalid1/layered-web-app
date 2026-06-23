"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Exercise } from "@/lib/types";
import { exerciseApi } from "@/services/exercise-api";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface EditClassPlanExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseId: string | null;
  classPlanClassType?: string | null;
  onSaved: () => void | Promise<void>;
}

/**
 * Full exercise editor in a dialog (create-picker style, library tab omitted).
 * Used for draft exercises (`savedToLibrary === false`) from a class plan section.
 */
export function EditClassPlanExerciseDialog({
  open,
  onOpenChange,
  exerciseId,
  classPlanClassType,
  onSaved,
}: EditClassPlanExerciseDialogProps) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(
    async (id: string, signal: AbortSignal) => {
      setLoading(true);
      setExercise(null);
      try {
        const data = await exerciseApi.getExerciseById(id, signal);
        if (!signal.aborted) {
          setExercise(data);
          setFormKey((k) => k + 1);
        }
      } catch {
        if (!signal.aborted) {
          toast.error("Could not load exercise");
          onOpenChange(false);
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (!open || !exerciseId) return;
    const ac = new AbortController();
    const id = exerciseId;
    const t = window.setTimeout(() => {
      void load(id, ac.signal);
    }, 0);
    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [open, exerciseId, load]);

  useEffect(() => {
    if (open) return;
    const t = window.setTimeout(() => {
      setExercise(null);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(90vh,800px)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-3xl border-border p-0 shadow-xl sm:max-w-6xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em]">
            Edit exercise
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update fields, layers, and images. Changes apply to this exercise in all class plans
            that reference it.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-4 pb-6 [-webkit-overflow-scrolling:touch]">
          {loading && (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
          {!loading && exercise && (
            <ExerciseForm
              key={formKey}
              exercise={exercise}
              embedInClassPlan
              classPlanClassType={classPlanClassType}
              onEmbedCancel={() => onOpenChange(false)}
              onEmbedEditSuccess={async () => {
                onOpenChange(false);
                await onSaved();
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
