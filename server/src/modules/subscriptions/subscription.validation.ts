import { z } from "zod";

export const createCheckoutSchema = z.object({
  interval: z.enum(["month", "year"]),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
