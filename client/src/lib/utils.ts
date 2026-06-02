import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Append a cache-busting query param so avatar images refresh after replace. */
export function avatarDisplayUrl(url: string | null | undefined, version?: number): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (version === undefined) return trimmed;
  const separator = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${separator}v=${version}`;
}

/** Two-letter initials from a display name (e.g. sidebar avatar after photo removal). */
export function getDisplayInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length >= 2) {
    const first = parts[0][0] ?? "";
    const last = parts[parts.length - 1][0] ?? "";
    return `${first}${last}`.toUpperCase();
  }
  const word = parts[0];
  if (word.length >= 2) return word.slice(0, 2).toUpperCase();
  const ch = word[0]?.toUpperCase() ?? "?";
  return `${ch}${ch}`;
}
