/** Local midnight for the given date (uses local TZ). */
export function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Monday-based week start (local). Monday = 0 offset from week start. */
export function startOfWeekMonday(d: Date): Date {
  const x = startOfLocalDay(d);
  const day = x.getDay(); // 0 Sun … 6 Sat
  const diffFromMon = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diffFromMon);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function formatYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

/** First day of month (local). */
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

/** Exclusive end of month (first day of next month). */
export function startOfNextMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

export const CALENDAR_DAY_START_HOUR = 6;
export const CALENDAR_DAY_END_HOUR = 22;

export function hourSlots(): number[] {
  const out: number[] = [];
  for (let h = CALENDAR_DAY_START_HOUR; h <= CALENDAR_DAY_END_HOUR; h++) out.push(h);
  return out;
}

/** Minutes from CALENDAR_DAY_START_HOUR local on `day` to `instant` (local). */
export function minutesFromDayStart(day: Date, instant: Date): number {
  const start = new Date(day);
  start.setHours(CALENDAR_DAY_START_HOUR, 0, 0, 0);
  return Math.round((instant.getTime() - start.getTime()) / 60000);
}

export function totalCalendarMinutes(): number {
  return (CALENDAR_DAY_END_HOUR - CALENDAR_DAY_START_HOUR + 1) * 60;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** True when `d` is strictly before today's local calendar day. */
export function isBeforeToday(d: Date): boolean {
  const day = startOfLocalDay(d);
  const today = startOfLocalDay(new Date());
  return day.getTime() < today.getTime();
}

/** Today's local calendar date as `YYYY-MM-DD`. */
export function todayYmd(): string {
  return formatYmdLocal(new Date());
}
