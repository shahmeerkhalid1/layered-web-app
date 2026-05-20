import { z } from "zod";

export const quickScheduleFormSchema = z.object({
  title: z.string().max(200).optional(),
  type: z.enum(["GROUP", "PRIVATE"]),
  durationMinutes: z.number().int().positive().max(24 * 60),
  date: z.string().min(1),
  time: z.string().min(1),
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
