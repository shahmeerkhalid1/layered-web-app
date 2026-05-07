import { z } from "zod";

export const createDropdownOptionSchema = z.object({
  label: z.string().min(1, "Label is required"),
});

export type CreateDropdownOptionInput = z.infer<
  typeof createDropdownOptionSchema
>;
