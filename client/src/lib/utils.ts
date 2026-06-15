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
  // Presigned S3 URLs break if extra query params are appended after signing.
  if (trimmed.includes("X-Amz-Signature=")) return trimmed;
  const separator = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${separator}v=${version}`;
}

/** Copy text to the clipboard; uses execCommand fallback on non-secure (HTTP) contexts. */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard?.writeText &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to legacy copy on permission or API failures.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    const ok = document.execCommand("copy");
    if (!ok) throw new Error("execCommand copy failed");
  } finally {
    document.body.removeChild(textarea);
  }
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
