import { z } from "zod";

const layerSchema = z.object({
  content: z.string(),
  order: z.number().int().min(0).optional(),
  isFinisher: z.boolean().default(false),
});

const layersField = z
  .array(layerSchema)
  .default([])
  .transform((layers) =>
    layers
      .map((l, i) => ({
        content: l.content.trim(),
        order: l.order ?? i,
        isFinisher: l.isFinisher ?? false,
      }))
      .filter((l) => l.content.length > 0)
  );

const nullableStr = z.string().nullish();

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: nullableStr,
  startingPosition: nullableStr,
  orientation: nullableStr,
  directionFaced: nullableStr,
  movementType: nullableStr,
  springs: nullableStr,
  equipment: z.array(z.string()).default([]),
  machineSetup: nullableStr,
  transitionCues: nullableStr,
  cueing: nullableStr,
  spinalMovement: z.array(z.string()).default([]),
  chainType: z.array(z.string()).max(2).default([]),
  jointLoading: z.array(z.string()).default([]),
  progressionNotes: nullableStr,
  regressionNotes: nullableStr,
  tags: z.array(z.string()).default([]),
  folderId: z.string().optional().nullable(),
  progressionOfId: z.string().optional().nullable(),
  layers: layersField,
  /** When false, exercise is hidden from library until promoted via save-to-library. */
  savedToLibrary: z.boolean().optional(),
});

export const updateExerciseSchema = createExerciseSchema.partial();

export const listExercisesQuerySchema = z.object({
  search: z.string().optional(),
  folderId: z.string().optional(),
  tag: z.string().optional(),
  savedToLibrary: z.enum(["true", "false"]).optional(),
  /** When set, response is `{ exercises, total, page, limit }` instead of a bare array. */
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const saveToLibrarySchema = z.object({
  folderId: z.string().nullable().optional(),
});

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required"),
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
export type ListExercisesQuery = z.infer<typeof listExercisesQuerySchema>;
export type SaveToLibraryInput = z.infer<typeof saveToLibrarySchema>;
