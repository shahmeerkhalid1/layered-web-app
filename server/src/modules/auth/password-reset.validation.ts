import { z } from "zod";

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  redirectTo: z.string().url().optional(),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
