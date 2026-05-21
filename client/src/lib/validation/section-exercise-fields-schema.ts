import { z } from "zod";

export const SECTION_EXERCISE_NOTES_MAX = 500;

/** Single number (12) or range (8-10) */
const REPS_PATTERN = /^\d+(?:\s*-\s*\d+)?$/;

/** Per-exercise duration: 30 sec, 1 min, 2-3 min, plain number, etc. */
const DURATION_PATTERN =
  /^(\d+\s*(?:-\s*\d+\s*)?(?:s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours)?|\d+\s*-\s*\d+)$/i;

const DURATION_CHARS = /^[\d\s\-–a-zA-Z]+$/;

export function trimSectionExerciseField(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

function refineReps(val: string, ctx: z.RefinementCtx): void {
  const t = val.trim();
  if (t === "") return;
  if (!REPS_PATTERN.test(t)) {
    ctx.addIssue({
      code: "custom",
      message: "Enter a number or range (e.g. 12 or 8-10)",
    });
  }
}

function refineDuration(val: string, ctx: z.RefinementCtx): void {
  const t = val.trim();
  if (t === "") return;
  if (!DURATION_CHARS.test(t)) {
    ctx.addIssue({
      code: "custom",
      message: "Duration can only include numbers, -, and time units",
    });
    return;
  }
  if (!DURATION_PATTERN.test(t)) {
    ctx.addIssue({
      code: "custom",
      message: "Enter a time (e.g. 30 sec, 1 min, 2-3 min)",
    });
  }
}

export const sectionExerciseRepsSchema = z.string().superRefine(refineReps);

export const sectionExerciseDurationSchema = z.string().superRefine(refineDuration);

export const sectionExerciseNotesSchema = z
  .string()
  .max(
    SECTION_EXERCISE_NOTES_MAX,
    `Notes must be at most ${SECTION_EXERCISE_NOTES_MAX} characters`
  );

export type SectionExerciseField = "reps" | "duration" | "notes";

const schemaByField = {
  reps: sectionExerciseRepsSchema,
  duration: sectionExerciseDurationSchema,
  notes: sectionExerciseNotesSchema,
} as const;

export function parseSectionExerciseFieldValue(
  field: SectionExerciseField,
  raw: string
): { ok: true; value: string | null } | { ok: false; message: string } {
  const parsed = schemaByField[field].safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid value",
    };
  }
  return { ok: true, value: trimSectionExerciseField(raw) };
}
