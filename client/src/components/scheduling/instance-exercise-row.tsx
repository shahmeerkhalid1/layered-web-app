"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PlanSectionExerciseRow } from "@/lib/types";
import { schedulingApi } from "@/services/scheduling-api";
import { ClassPlanExerciseProgrammingSummary } from "@/components/class-plans/class-plan-exercise-programming-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [reps, setReps] = useState(row.reps ?? "");
  const [duration, setDuration] = useState(row.duration ?? "");
  const [notes, setNotes] = useState(row.notes ?? "");
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
      await schedulingApi.updateInstanceSectionExercise(instanceId, sectionId, row.id, {
        [field]: next,
      });
      await onUpdated();
    } catch {
      toast.error("Could not save changes");
    } finally {
      setPending(false);
    }
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <p className="mb-1 text-[10px] font-medium text-muted-foreground">Reps</p>
            <Input
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              onBlur={() => void patchField("reps", reps)}
              disabled={disabled || pending}
              className="h-9 rounded-xl text-sm"
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-medium text-muted-foreground">Duration</p>
            <Input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onBlur={() => void patchField("duration", duration)}
              disabled={disabled || pending}
              className="h-9 rounded-xl text-sm"
            />
          </div>
          <div className="sm:col-span-1">
            <p className="mb-1 text-[10px] font-medium text-muted-foreground">Notes</p>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => void patchField("notes", notes)}
              disabled={disabled || pending}
              className="h-9 rounded-xl text-sm"
            />
          </div>
        </div>
      </div>
    </li>
  );
}
