import { z } from "zod";
import { isPastScheduleDateTime } from "@/lib/calendar-utils";
import { schedulingDurationMinutesStrSchema } from "@/lib/validation/duration-minutes-form-schema";
import { PAST_SCHEDULE_TIME_MESSAGE } from "@/lib/validation/scheduling-past-guard";

export const RECURRING_END_DATE_MESSAGE = "End date is required for recurring classes";
export const RECURRING_DAYS_OF_WEEK_MESSAGE =
  "Select at least one weekday for recurring classes";

export const createClassFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    type: z.enum(["GROUP", "PRIVATE"]),
    durationMinutesStr: schedulingDurationMinutesStrSchema,
    templateId: z.string().optional(),
    isRecurring: z.boolean(),
    startDate: z.string().trim().min(1, "Start date is required"),
    endDate: z.string(),
    clockTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "Select a time"),
  })
  .refine((data) => !data.isRecurring || data.endDate.trim().length > 0, {
    message: RECURRING_END_DATE_MESSAGE,
    path: ["endDate"],
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring) return;
    if (isPastScheduleDateTime(data.startDate, data.clockTime)) {
      ctx.addIssue({
        code: "custom",
        message: PAST_SCHEDULE_TIME_MESSAGE,
        path: ["clockTime"],
      });
    }
  });

export type CreateClassFormValues = z.infer<typeof createClassFormSchema>;
