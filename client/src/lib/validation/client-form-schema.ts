import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));

const requiredEmail = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Invalid email");

export const clientFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: requiredEmail,
  phone: optionalText,
  injuries: optionalText,
  focusAreas: optionalText,
  goals: optionalText,
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export function buildClientFormDefaults(
  client?: Partial<{
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    injuries?: string | null;
    focusAreas?: string | null;
    goals?: string | null;
  }>
): ClientFormValues {
  return {
    firstName: client?.firstName ?? "",
    lastName: client?.lastName ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    injuries: client?.injuries ?? "",
    focusAreas: client?.focusAreas ?? "",
    goals: client?.goals ?? "",
  };
}
