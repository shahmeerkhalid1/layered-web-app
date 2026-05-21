/** Parse `HH:mm` to a local Date (today, seconds zeroed). */
export function hmToDate(hm: string): Date {
  const parts = hm.split(":");
  const hh = Number(parts[0] ?? 0);
  const mm = Number(parts[1] ?? 0);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d;
}

/** Format a Date as `HH:mm` in local time. */
export function dateToHm(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Display label for `HH:mm` (12-hour with AM/PM, like native time input). */
export function formatHmLabel12(hm: string, placeholder = "Pick a time"): string {
  const trimmed = hm.trim();
  if (!trimmed) return placeholder;
  const d = hmToDate(trimmed);
  const period = d.getHours() >= 12 ? "PM" : "AM";
  const hour = d.getHours() % 12 || 12;
  const hourStr = String(hour).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${hourStr}:${minute} ${period}`;
}

/** Local calendar `YYYY-MM-DD` + `HH:mm` → UTC ISO instant. */
export function localDateAndTimeToUtcIso(dateYmd: string, timeHm: string): string {
  const [y, m, d] = dateYmd.split("-").map(Number);
  const parts = timeHm.split(":");
  const hh = Number(parts[0] ?? 0);
  const mm = Number(parts[1] ?? 0);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh, mm, 0, 0).toISOString();
}

export function localYmdToUtcIsoMidday(dateYmd: string): string {
  const [y, m, d] = dateYmd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0).toISOString();
}
