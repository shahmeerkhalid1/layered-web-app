import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));

const requiredEmail = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Invalid email");

export const createClientSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: requiredEmail,
  phone: optionalText,
  injuries: optionalText,
  focusAreas: optionalText,
  goals: optionalText,
});

export const updateClientSchema = createClientSchema.partial().extend({
  email: requiredEmail,
});

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export const deleteClientsSchema = z.object({
  clientIds: z
    .array(z.string().min(1))
    .min(1, "At least one client is required")
    .max(100, "You can archive up to 100 clients at a time"),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
export type DeleteClientsInput = z.infer<typeof deleteClientsSchema>;
