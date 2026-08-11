import {
  isPastScheduleDateTime,
  localIsoWeekdayFromYmd,
  todayYmd,
} from "@/lib/calendar-utils";

export const PAST_SCHEDULE_TIME_MESSAGE = "Start time cannot be in the past";

/** Whether create/quick-schedule should reject a past time for the chosen start date. */
export function requiresPastTimeCheck(
  dateYmd: string,
  isRecurring: boolean,
  recurringDays?: Iterable<number>
): boolean {
  if (!isRecurring) return true;
  if (dateYmd !== todayYmd()) return false;
  const weekday = localIsoWeekdayFromYmd(dateYmd);
  for (const d of recurringDays ?? []) {
    if (d === weekday) return true;
  }
  return false;
}

export function validateScheduleDateTime(
  dateYmd: string,
  timeHm: string,
  isRecurring: boolean,
  recurringDays?: Iterable<number>
): string | null {
  if (!requiresPastTimeCheck(dateYmd, isRecurring, recurringDays)) return null;
  if (isPastScheduleDateTime(dateYmd, timeHm)) {
    return PAST_SCHEDULE_TIME_MESSAGE;
  }
  return null;
}

/**
 * Edit series: future regen from today can reschedule today's occurrence when the series
 * has already started and today's weekday is in the recurrence rule.
 */
export function requiresEditSeriesPastTimeCheck(
  isRecurring: boolean,
  startDateYmd: string,
  recurringDays?: Iterable<number>
): boolean {
  if (!isRecurring) return true;
  const today = todayYmd();
  if (startDateYmd > today) return false;
  const weekday = localIsoWeekdayFromYmd(today);
  for (const d of recurringDays ?? []) {
    if (d === weekday) return true;
  }
  return false;
}

export function validateEditSeriesDateTime(
  startDateYmd: string,
  clockTime: string,
  isRecurring: boolean,
  recurringDays?: Iterable<number>
): string | null {
  if (!requiresEditSeriesPastTimeCheck(isRecurring, startDateYmd, recurringDays)) {
    return null;
  }
  const dateYmd = isRecurring ? todayYmd() : startDateYmd;
  if (isPastScheduleDateTime(dateYmd, clockTime)) {
    return PAST_SCHEDULE_TIME_MESSAGE;
  }
  return null;
}
