import { z } from "zod";
import { MAX_DURATION_MINUTES } from "../../lib/duration-limits";

export const recurrenceRuleSchema = z.object({
  daysOfWeek: z.array(z.number().int().min(1).max(7)).min(1),
});

export const listClassesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(["GROUP", "PRIVATE"]).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const createClassSchema = z
  .object({
    title: z.string().min(1).max(200),
    type: z.enum(["GROUP", "PRIVATE"]).default("GROUP"),
    isRecurring: z.boolean().default(false),
    recurrenceRule: recurrenceRuleSchema.optional().nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    time: z.coerce.date(),
    durationMinutes: z.number().int().positive().max(MAX_DURATION_MINUTES).default(60),
    templateId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring) {
      if (!data.recurrenceRule?.daysOfWeek?.length) {
        ctx.addIssue({
          code: "custom",
          message: "recurrenceRule.daysOfWeek is required when isRecurring is true",
          path: ["recurrenceRule"],
        });
      }
      if (!data.endDate) {
        ctx.addIssue({
          code: "custom",
          message: "endDate is required when isRecurring is true",
          path: ["endDate"],
        });
      }
    }
    if (data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: "custom",
        message: "endDate must be on or after startDate",
        path: ["endDate"],
      });
    }
  });

export const updateClassSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    type: z.enum(["GROUP", "PRIVATE"]).optional(),
    isRecurring: z.boolean().optional(),
    recurrenceRule: recurrenceRuleSchema.optional().nullable(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional().nullable(),
    time: z.coerce.date().optional(),
    durationMinutes: z.number().int().positive().max(MAX_DURATION_MINUTES).optional(),
    templateId: z.string().optional().nullable(),
    regenerateFutureInstancesFrom: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    /** Target calendar date when rescheduling a recurring series from an instance drawer. */
    rescheduleToDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .refine(
    (d) =>
      d.title !== undefined ||
      d.type !== undefined ||
      d.isRecurring !== undefined ||
      d.recurrenceRule !== undefined ||
      d.startDate !== undefined ||
      d.endDate !== undefined ||
      d.time !== undefined ||
      d.durationMinutes !== undefined ||
      d.templateId !== undefined ||
      d.regenerateFutureInstancesFrom !== undefined ||
      d.rescheduleToDate !== undefined,
    { message: "At least one field is required" }
  );

export const listClassInstancesQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  classId: z.string().optional(),
});

export const updateClassInstanceSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    time: z.coerce.date().optional(),
    status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  })
  .refine(
    (d) => d.date !== undefined || d.time !== undefined || d.status !== undefined,
    { message: "At least one of date, time, or status is required" }
  );

export const assignTemplateSchema = z.object({
  templateId: z.string().min(1),
});

export const quickScheduleSchema = z
  .object({
    title: z.string().max(200).optional(),
    type: z.enum(["GROUP", "PRIVATE"]).default("GROUP"),
    durationMinutes: z.number().int().positive().max(MAX_DURATION_MINUTES).default(60),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().min(1),
    templateId: z.string().optional(),
  })
  .refine(
    (d) =>
      (d.title !== undefined && d.title.trim().length > 0) ||
      (d.templateId !== undefined && d.templateId.length > 0),
    { message: "Provide title or templateId", path: ["title"] }
  );

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type ListClassesQuery = z.infer<typeof listClassesQuerySchema>;
export type ListClassInstancesQuery = z.infer<typeof listClassInstancesQuerySchema>;
export type UpdateClassInstanceInput = z.infer<typeof updateClassInstanceSchema>;
export type QuickScheduleInput = z.infer<typeof quickScheduleSchema>;

export const enrollClientsSchema = z.object({
  clientIds: z
    .array(z.string().min(1))
    .min(1, "At least one client is required")
    .max(100, "You can enroll up to 100 clients at a time"),
});

export const unenrollClientsSchema = z.object({
  enrollmentIds: z
    .array(z.string().min(1))
    .min(1, "At least one enrollment is required")
    .max(100, "You can remove up to 100 enrollments at a time"),
});

/** @deprecated Use enrollClientsSchema — kept as alias for route imports */
export const enrollClientSchema = enrollClientsSchema;

export const markAttendanceSchema = z.object({
  attendance: z.array(
    z.object({
      clientId: z.string().min(1),
      present: z.boolean(),
    })
  ),
});

export type EnrollClientsInput = z.infer<typeof enrollClientsSchema>;
export type EnrollClientInput = EnrollClientsInput;
export type UnenrollClientsInput = z.infer<typeof unenrollClientsSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
