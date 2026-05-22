import { z } from "zod";
import type { Exercise } from "@/lib/types";

export const exerciseLayerRowSchema = z.object({
  content: z.string(),
  isFinisher: z.boolean(),
});

export const exerciseFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  startingPosition: z.string(),
  orientation: z.string(),
  directionFaced: z.string(),
  movementType: z
    .string()
    .refine((v) => v !== "none", { message: "Select a movement type" }),
  springs: z.string(),
  equipment: z.array(z.string()),
  machineSetup: z.string(),
  layers: z.array(exerciseLayerRowSchema).min(1, "Add at least one layer"),
  transitionCues: z.string(),
  cueing: z.string(),
  spinalMovement: z.array(z.string()),
  chainType: z
    .array(z.string())
    .max(2, 'Choose at most two chain types, or "Both" alone'),
  jointLoading: z.array(z.string()),
  progressionNotes: z.string(),
  regressionNotes: z.string(),
  tags: z.array(z.string()),
  folderId: z.string(),
  progressionOfId: z.string(),
});

export type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

function coerceStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v): v is string => typeof v === "string");
  if (typeof val === "string" && val.trim().length > 0) return [val.trim()];
  return [];
}

export function buildExerciseFormDefaults(exercise?: Exercise): ExerciseFormValues {
  const layers = exercise?.layers ?? [];
  const layerRows =
    layers.length === 0
      ? [{ content: "", isFinisher: false }]
      : [...layers]
          .sort((a, b) => a.order - b.order)
          .map((l) => ({
            content: l.content,
            isFinisher: l.isFinisher ?? false,
          }));

  return {
    name: exercise?.name ?? "",
    description: exercise?.description ?? "",
    startingPosition: exercise?.startingPosition ?? "",
    orientation: exercise?.orientation ?? "none",
    directionFaced: exercise?.directionFaced ?? "none",
    movementType: exercise?.movementType ?? "none",
    springs: exercise?.springs ?? "",
    equipment: coerceStringArray(exercise?.equipment),
    machineSetup: exercise?.machineSetup ?? "none",
    layers: layerRows,
    transitionCues: exercise?.transitionCues ?? "",
    cueing: exercise?.cueing ?? "",
    spinalMovement: exercise?.spinalMovement ?? [],
    chainType: coerceStringArray(exercise?.chainType),
    jointLoading: exercise?.jointLoading ?? [],
    progressionNotes: exercise?.progressionNotes ?? "",
    regressionNotes: exercise?.regressionNotes ?? "",
    tags: exercise?.tags ?? [],
    folderId: exercise?.folderId ?? "none",
    progressionOfId: exercise?.progressionOfId ?? "none",
  };
}
