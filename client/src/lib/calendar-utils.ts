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

/** Local calendar day for a scheduled instance (`time` is the source of truth). */
export function instanceLocalDayKey(inst: { time: string }): string {
  return formatYmdLocal(new Date(inst.time));
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

/** Inclusive local-hour range shown in the week grid (0 = midnight … 23 = 11 PM). */
export const CALENDAR_DAY_START_HOUR = 0;
export const CALENDAR_DAY_END_HOUR = 23;

/** Pixel height per hour row in the week grid (drives column `height`). */
export const CALENDAR_HOUR_HEIGHT_PX = 72;

export function calendarHourCount(): number {
  return CALENDAR_DAY_END_HOUR - CALENDAR_DAY_START_HOUR + 1;
}

export function calendarDayColumnHeightPx(): number {
  return calendarHourCount() * CALENDAR_HOUR_HEIGHT_PX;
}

export function hourSlots(): number[] {
  const out: number[] = [];
  for (let h = CALENDAR_DAY_START_HOUR; h <= CALENDAR_DAY_END_HOUR; h++) out.push(h);
  return out;
}

/** 12-hour label for a week-grid hour index (0–23). */
export function formatCalendarHourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

/** Minutes from CALENDAR_DAY_START_HOUR local on `day` to `instant` (local). */
export function minutesFromDayStart(day: Date, instant: Date): number {
  const start = new Date(day);
  start.setHours(CALENDAR_DAY_START_HOUR, 0, 0, 0);
  return Math.round((instant.getTime() - start.getTime()) / 60000);
}

export function totalCalendarMinutes(): number {
  return calendarHourCount() * 60;
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

/** Current local time as 24-hour `HH:mm`. */
export function currentHm(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/** ISO weekday from local calendar `YYYY-MM-DD`: Monday = 1 … Sunday = 7. */
export function localIsoWeekdayFromYmd(ymd: string): number {
  const w = parseYmdLocal(ymd).getDay();
  return w === 0 ? 7 : w;
}

/** True when local `dateYmd` + `timeHm` is strictly before now. */
export function isPastScheduleDateTime(dateYmd: string, timeHm: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd) || !/^\d{2}:\d{2}$/.test(timeHm)) return false;
  const [y, m, d] = dateYmd.split("-").map(Number);
  const [hh, mm] = timeHm.split(":").map(Number);
  const scheduled = new Date(y, m - 1, d, hh, mm, 0, 0);
  return scheduled.getTime() < Date.now();
}

/**
 * True when an hour slot (0–23, :00) on local day `d` is before now.
 * Past calendar days are always treated as past.
 */
export function isPastCalendarHourSlot(d: Date, hour: number): boolean {
  if (isBeforeToday(d)) return true;
  if (!isSameLocalDay(d, new Date())) return false;
  const now = new Date();
  if (hour < now.getHours()) return true;
  if (hour === now.getHours() && now.getMinutes() > 0) return true;
  return false;
}

/** Deep link to open a class instance in the calendar drawer. */
export function calendarInstanceHref(instanceId: string): string {
  return `/calendar?instance=${encodeURIComponent(instanceId)}`;
}

/** Deep link to the calendar week view centered on a local calendar day (`YYYY-MM-DD`). */
export function calendarDayHref(ymd: string): string {
  return `/calendar?date=${encodeURIComponent(ymd)}`;
}
