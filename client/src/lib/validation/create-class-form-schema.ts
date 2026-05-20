import { z } from "zod";

export const createClassFormSchema = z
  .object({
    title: z.string().min(1).max(200),
    type: z.enum(["GROUP", "PRIVATE"]),
    durationMinutes: z.number().int().positive().max(24 * 60),
    templateId: z.string().optional(),
    isRecurring: z.boolean(),
    startDate: z.string().min(1),
    endDate: z.string().optional(),
    clockTime: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring) {
      if (!data.endDate?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "End date is required for recurring classes",
          path: ["endDate"],
        });
      }
    }
  });

export type CreateClassFormValues = z.infer<typeof createClassFormSchema>;
