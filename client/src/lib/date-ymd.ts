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
