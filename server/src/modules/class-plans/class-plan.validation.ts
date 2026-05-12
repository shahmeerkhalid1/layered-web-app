import { z } from "zod";

const planSectionExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  order: z.number().int().nonnegative(),
  reps: z.string().max(100).optional(),
  duration: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

const planSectionSchema = z.object({
  name: z.string().min(1).max(200),
  order: z.number().int().nonnegative(),
  exercises: z.array(planSectionExerciseSchema).optional(),
});

export const createClassPlanSchema = z.object({
  name: z.string().min(1).max(200),
  classType: z.string().max(100).optional(),
  classStyle: z.string().max(100).optional(),
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
