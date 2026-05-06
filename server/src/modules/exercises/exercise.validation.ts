import { z } from "zod";

export const createExerciseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  cueing: z.string().optional(),
  tags: z.array(z.string()).default([]),
  folderId: z.string().optional().nullable(),
  progressionOfId: z.string().optional().nullable(),
});

export const updateExerciseSchema = createExerciseSchema.partial();

export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
});

export const updateFolderSchema = createFolderSchema.partial();

export const setProgressionSchema = z.object({
  progressionOfId: z.string().nullable(),
});

export const reorderImagesSchema = z.object({
  imageIds: z.array(z.string()).min(1, "At least one image ID is required"),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
