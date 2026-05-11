import { z } from "zod";

const layerSchema = z.object({
  content: z.string(),
  order: z.number().int().min(0).optional(),
});

const layersField = z
  .array(layerSchema)
  .default([])
  .transform((layers) =>
    layers
      .map((l, i) => ({
        content: l.content.trim(),
        order: l.order ?? i,
      }))
      .filter((l) => l.content.length > 0)
  );

const nullableStr = z.string().nullish();

export const createExerciseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: nullableStr,
  startingPosition: nullableStr,
  orientation: nullableStr,
  directionFaced: nullableStr,
  movementType: nullableStr,
  springs: nullableStr,
  equipment: nullableStr,
  machineSetup: nullableStr,
  transitionCues: nullableStr,
  cueing: nullableStr,
  spinalMovement: z.array(z.string()).default([]),
  chainType: nullableStr,
  jointLoading: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  folderId: z.string().optional().nullable(),
  progressionOfId: z.string().optional().nullable(),
  layers: layersField,
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
