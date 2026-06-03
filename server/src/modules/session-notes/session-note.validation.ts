import { z } from "zod";

export const createSessionNoteSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  content: z.string().trim().optional().default(""),
  exerciseIds: z.array(z.string().min(1)).optional().default([]),
});

export const updateSessionNoteSchema = z.object({
  content: z.string().trim().optional(),
});

export const attachExercisesSchema = z.object({
  exerciseIds: z.array(z.string().min(1)).min(1, "At least one exercise is required"),
});

export const listClientNotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateSessionNoteInput = z.infer<typeof createSessionNoteSchema>;
export type UpdateSessionNoteInput = z.infer<typeof updateSessionNoteSchema>;
export type AttachExercisesInput = z.infer<typeof attachExercisesSchema>;
export type ListClientNotesQuery = z.infer<typeof listClientNotesQuerySchema>;
