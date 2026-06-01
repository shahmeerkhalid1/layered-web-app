import { z } from "zod";

/** Max class / template duration in minutes (8 hours). Aligned with server `MAX_DURATION_MINUTES`. */
export const SCHEDULING_MAX_DURATION_MINUTES = 480;

/** Client-side cap for class plan template duration. */
export const CLASS_PLAN_MAX_DURATION_MINUTES = 480;

const MAX_DURATION_MESSAGE = "Duration must be at most 480 minutes";

export function createDurationMinutesStrSchema(maxMinutes: number, maxMessage: string) {
  return z
    .string()
    .trim()
    .min(1, "Duration is required")
    .regex(/^\d+$/, "Enter a whole number of minutes")
    .refine((s) => parseInt(s, 10) >= 1, "Duration must be at least 1 minute")
    .refine((s) => parseInt(s, 10) <= maxMinutes, maxMessage);
}

export const schedulingDurationMinutesStrSchema = createDurationMinutesStrSchema(
  SCHEDULING_MAX_DURATION_MINUTES,
  MAX_DURATION_MESSAGE
);

export const classPlanDurationMinutesStrSchema = createDurationMinutesStrSchema(
  CLASS_PLAN_MAX_DURATION_MINUTES,
  MAX_DURATION_MESSAGE
);

export function parseDurationMinutesStr(value: string): number {
  return parseInt(value.trim(), 10);
}
