export function getAuthCallbackUrl(path = "/"): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return path;
}
