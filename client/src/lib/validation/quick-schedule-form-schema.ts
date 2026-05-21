import { z } from "zod";

export const quickScheduleFormSchema = z.object({
  title: z.string().max(200).optional(),
  type: z.enum(["GROUP", "PRIVATE"]),
  durationMinutes: z
    .number({ message: "Duration is required" })
    .int("Duration must be a whole number")
    .positive("Duration must be at least 1 minute")
    .max(24 * 60, "Duration cannot exceed 24 hours"),
  date: z.string().superRefine((v, ctx) => {
    const d = v.trim();
    if (!d) {
      ctx.addIssue({ code: "custom", message: "Select a date" });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      ctx.addIssue({ code: "custom", message: "Select a valid date" });
    }
  }),
  time: z.string().superRefine((v, ctx) => {
    const t = v.trim();
    if (!t) {
      ctx.addIssue({ code: "custom", message: "Select a start time" });
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(t)) {
      ctx.addIssue({ code: "custom", message: "Select a valid start time" });
    }
  }),
});

export type QuickScheduleFormValues = z.infer<typeof quickScheduleFormSchema>;

export function toQuickScheduleApiBody(
  values: QuickScheduleFormValues,
  templateId?: string
): {
  title?: string;
  type: "GROUP" | "PRIVATE";
  durationMinutes: number;
  date: string;
  time: string;
  templateId?: string;
} {
  const title = values.title?.trim();
  return {
    ...(title && title.length > 0 ? { title } : {}),
    type: values.type,
    durationMinutes: values.durationMinutes,
    date: values.date,
    time: values.time,
    ...(templateId ? { templateId } : {}),
  };
}
