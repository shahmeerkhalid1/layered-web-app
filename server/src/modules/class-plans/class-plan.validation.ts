import { z } from "zod";

const REPS_PATTERN = /^\d+(?:\s*-\s*\d+)?$/;
const DURATION_PATTERN =
  /^(\d+\s*(?:-\s*\d+\s*)?(?:s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours)?|\d+\s*-\s*\d+)$/i;
const DURATION_CHARS = /^[\d\s\-–a-zA-Z]+$/;

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

const sectionExerciseRepsField = z.string().superRefine(refineReps);

const sectionExerciseDurationField = z.string().superRefine(refineDuration);

const sectionExerciseNotesField = z.string().max(500);

const planSectionExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  order: z.number().int().nonnegative(),
  reps: sectionExerciseRepsField.optional(),
  duration: sectionExerciseDurationField.optional(),
  notes: sectionExerciseNotesField.optional(),
});

const planSectionSchema = z.object({
  name: z.string().min(1).max(200),
  order: z.number().int().nonnegative(),
  exercises: z.array(planSectionExerciseSchema).optional(),
});

export const createClassPlanSchema = z.object({
  name: z.string().min(1).max(200),
  classType: z.string().max(100).nullable().optional(),
  classStyle: z.string().max(100).nullable().optional(),
  durationMinutes: z.number().int().positive().optional(),
  folderId: z.string().nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  sections: z.array(planSectionSchema).optional(),
});

export const updateClassPlanSchema = createClassPlanSchema.partial();

export const listClassPlansSchema = z.object({
  search: z.string().optional(),
  folderId: z.string().optional(),
  classType: z.string().optional(),
  classStyle: z.string().optional(),
  tags: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateClassPlanInput = z.infer<typeof createClassPlanSchema>;
export type UpdateClassPlanInput = z.infer<typeof updateClassPlanSchema>;
export type ListClassPlansQuery = z.infer<typeof listClassPlansSchema>;

export const addSectionSchema = z.object({
  name: z.string().min(1).max(200),
  order: z.number().int().nonnegative().optional(),
});

export const updateSectionSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    order: z.number().int().nonnegative().optional(),
  })
  .refine((d) => d.name !== undefined || d.order !== undefined, {
    message: "At least one of name or order is required",
  });

export type AddSectionInput = z.infer<typeof addSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

export const addExerciseToSectionSchema = z.object({
  exerciseId: z.string().min(1),
  order: z.number().int().nonnegative().optional(),
  reps: sectionExerciseRepsField.optional(),
  duration: sectionExerciseDurationField.optional(),
  notes: sectionExerciseNotesField.optional(),
});

export const updateSectionExerciseSchema = z
  .object({
    order: z.number().int().nonnegative().optional(),
    reps: sectionExerciseRepsField.nullable().optional(),
    duration: sectionExerciseDurationField.nullable().optional(),
    notes: sectionExerciseNotesField.nullable().optional(),
  })
  .refine(
    (d) =>
      d.order !== undefined ||
      d.reps !== undefined ||
      d.duration !== undefined ||
      d.notes !== undefined,
    { message: "At least one of order, reps, duration, or notes is required" }
  );

export type AddExerciseToSectionInput = z.infer<typeof addExerciseToSectionSchema>;
export type UpdateSectionExerciseInput = z.infer<typeof updateSectionExerciseSchema>;
