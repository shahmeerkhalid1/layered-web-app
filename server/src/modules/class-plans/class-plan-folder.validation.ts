import { z } from "zod";

export const createClassPlanFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
});

export type CreateClassPlanFolderInput = z.infer<typeof createClassPlanFolderSchema>;
