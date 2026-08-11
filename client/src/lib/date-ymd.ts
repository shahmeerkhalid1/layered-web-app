import { format, isValid, parse } from "date-fns";

/** Parse `YYYY-MM-DD` to a local Date, or undefined if invalid/empty. */
export function ymdToDate(ymd: string): Date | undefined {
  const trimmed = ymd.trim();
  if (!trimmed) return undefined;
  const parsed = parse(trimmed, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

/** Format a Date as `YYYY-MM-DD` in local time. */
export function dateToYmd(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Human-readable label for a `YYYY-MM-DD` value. */
export function formatYmdLabel(ymd: string, placeholder = "Pick a date"): string {
  const date = ymdToDate(ymd);
  if (!date) return placeholder;
  return format(date, "MMM d, yyyy");
}

/** Signed calendar-day difference (`to` − `from`) for `YYYY-MM-DD` strings. */
export function ymdDayDiff(from: string, to: string): number {
  const start = ymdToDate(from);
  const end = ymdToDate(to);
  if (!start || !end) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** Shift a `YYYY-MM-DD` value by `days` (negative allowed). */
export function shiftYmd(ymd: string, days: number): string {
  const date = ymdToDate(ymd);
  if (!date) return ymd;
  date.setDate(date.getDate() + days);
  return dateToYmd(date);
}
