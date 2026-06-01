import { z } from "zod";
import {
  parseDurationMinutesStr,
  schedulingDurationMinutesStrSchema,
} from "@/lib/validation/duration-minutes-form-schema";

export const RECURRING_END_DATE_MESSAGE = "End date is required for recurring classes";
export const RECURRING_DAYS_OF_WEEK_MESSAGE =
  "Select at least one weekday for recurring classes";
export const TITLE_REQUIRED_MESSAGE = "Title is required";

export const quickScheduleFormSchema = z
  .object({
    title: z.string().trim().max(200).optional(),
    type: z.enum(["GROUP", "PRIVATE"]),
    durationMinutesStr: schedulingDurationMinutesStrSchema,
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
    isRecurring: z.boolean(),
    endDate: z.string(),
  })
  .refine((data) => !data.isRecurring || data.endDate.trim().length > 0, {
    message: RECURRING_END_DATE_MESSAGE,
    path: ["endDate"],
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
    durationMinutes: parseDurationMinutesStr(values.durationMinutesStr),
    date: values.date.trim(),
    time: values.time.trim(),
    ...(templateId ? { templateId } : {}),
  };
}
