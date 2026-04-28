import { z } from "zod";

export const inviteSchema = z.object({
  email: z.email(),
  role: z.enum(["ADMIN", "INSTRUCTOR"]).default("INSTRUCTOR"),
});

export const settingsPatchSchema = z.object({
  signupEnabled: z.boolean().optional(),
});

export type InviteInput = z.infer<typeof inviteSchema>;
export type SettingsPatchInput = z.infer<typeof settingsPatchSchema>;
