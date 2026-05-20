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
