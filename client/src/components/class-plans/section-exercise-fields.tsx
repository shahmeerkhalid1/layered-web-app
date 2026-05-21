"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { PlanSectionExerciseRow } from "@/lib/types";
import {
  parseSectionExerciseFieldValue,
  SECTION_EXERCISE_NOTES_MAX,
  type SectionExerciseField,
} from "@/lib/validation/section-exercise-fields-schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldErrors = Partial<Record<SectionExerciseField, string>>;

export interface SectionExerciseFieldsProps {
  row: Pick<PlanSectionExerciseRow, "id" | "reps" | "duration" | "notes">;
  disabled?: boolean;
  variant?: "template" | "instance";
  onPatchField: (
    field: SectionExerciseField,
    value: string | null
  ) => Promise<void>;
}

export function SectionExerciseFields({
  row,
  disabled = false,
  variant = "template",
  onPatchField,
}: SectionExerciseFieldsProps) {
  const [reps, setReps] = useState(row.reps ?? "");
  const [duration, setDuration] = useState(row.duration ?? "");
  const [notes, setNotes] = useState(row.notes ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [fieldDirty, setFieldDirty] = useState<Partial<Record<SectionExerciseField, boolean>>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setReps(row.reps ?? "");
      setDuration(row.duration ?? "");
      setNotes(row.notes ?? "");
      setErrors({});
      setFieldDirty({});
    }, 0);
    return () => window.clearTimeout(t);
  }, [row.id]);

  useEffect(() => {
    if (!fieldDirty.reps && !errors.reps) setReps(row.reps ?? "");
  }, [row.reps, fieldDirty.reps, errors.reps]);

  useEffect(() => {
    if (!fieldDirty.duration && !errors.duration) setDuration(row.duration ?? "");
  }, [row.duration, fieldDirty.duration, errors.duration]);

  useEffect(() => {
    if (!fieldDirty.notes && !errors.notes) setNotes(row.notes ?? "");
  }, [row.notes, fieldDirty.notes, errors.notes]);

  const markFieldDirty = useCallback((field: SectionExerciseField) => {
    setFieldDirty((prev) => ({ ...prev, [field]: true }));
  }, []);

  const markFieldClean = useCallback((field: SectionExerciseField) => {
    setFieldDirty((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleBlur = async (field: SectionExerciseField, raw: string) => {
    const parsed = parseSectionExerciseFieldValue(field, raw);
    if (!parsed.ok) {
      setErrors((prev) => ({ ...prev, [field]: parsed.message }));
      return;
    }

    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

    const prev =
      field === "reps"
        ? row.reps ?? null
        : field === "duration"
          ? row.duration ?? null
          : row.notes ?? null;
    if (parsed.value === prev) {
      markFieldClean(field);
      return;
    }

    setPending(true);
    try {
      await onPatchField(field, parsed.value);
      markFieldClean(field);
    } catch {
      toast.error("Could not save changes");
    } finally {
      setPending(false);
    }
  };

  const fieldDisabled = disabled || pending;
  const isTemplate = variant === "template";

  const repsInput = (
    <Input
      id={`reps-${row.id}`}
      value={reps}
      onChange={(e) => {
        setReps(e.target.value);
        markFieldDirty("reps");
        if (errors.reps) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.reps;
            return next;
          });
        }
      }}
      onBlur={() => void handleBlur("reps", reps)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      disabled={fieldDisabled}
      className={cn(
        "h-9 rounded-xl text-sm",
        errors.reps && "border-destructive"
      )}
      aria-invalid={errors.reps ? true : undefined}
      placeholder="e.g. 12 or 8-10"
    />
  );

  const durationInput = (
    <Input
      id={`dur-${row.id}`}
      value={duration}
      onChange={(e) => {
        setDuration(e.target.value);
        markFieldDirty("duration");
        if (errors.duration) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.duration;
            return next;
          });
        }
      }}
      onBlur={() => void handleBlur("duration", duration)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      disabled={fieldDisabled}
      className={cn(
        "h-9 rounded-xl text-sm",
        errors.duration && "border-destructive"
      )}
      aria-invalid={errors.duration ? true : undefined}
      placeholder="e.g. 30 sec or 1 min"
    />
  );

  const notesInput = (
    <Input
      id={`notes-${row.id}`}
      value={notes}
      onChange={(e) => {
        setNotes(e.target.value);
        markFieldDirty("notes");
        if (errors.notes) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.notes;
            return next;
          });
        }
      }}
      onBlur={() => void handleBlur("notes", notes)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      disabled={fieldDisabled}
      maxLength={SECTION_EXERCISE_NOTES_MAX}
      className={cn(
        "h-9 rounded-xl text-sm",
        errors.notes && "border-destructive"
      )}
      aria-invalid={errors.notes ? true : undefined}
      placeholder="Optional notes"
    />
  );

  if (isTemplate) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`reps-${row.id}`} className="text-xs text-muted-foreground">
            Reps
          </Label>
          {repsInput}
          {errors.reps && (
            <p className="text-xs text-destructive">{errors.reps}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor={`dur-${row.id}`} className="text-xs text-muted-foreground">
            Duration
          </Label>
          {durationInput}
          {errors.duration && (
            <p className="text-xs text-destructive">{errors.duration}</p>
          )}
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor={`notes-${row.id}`} className="text-xs text-muted-foreground">
            Notes
          </Label>
          {notesInput}
          {errors.notes && (
            <p className="text-xs text-destructive">{errors.notes}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <div>
        <Label htmlFor={`reps-${row.id}`} className="mb-1 text-[10px] font-medium text-muted-foreground">
          Reps
        </Label>
        {repsInput}
        {errors.reps && (
          <p className="mt-1 text-xs text-destructive">{errors.reps}</p>
        )}
      </div>
      <div>
        <Label htmlFor={`dur-${row.id}`} className="mb-1 text-[10px] font-medium text-muted-foreground">
          Duration
        </Label>
        {durationInput}
        {errors.duration && (
          <p className="mt-1 text-xs text-destructive">{errors.duration}</p>
        )}
      </div>
      <div className="sm:col-span-1">
        <Label htmlFor={`notes-${row.id}`} className="mb-1 text-[10px] font-medium text-muted-foreground">
          Notes
        </Label>
        {notesInput}
        {errors.notes && (
          <p className="mt-1 text-xs text-destructive">{errors.notes}</p>
        )}
      </div>
    </div>
  );
}
