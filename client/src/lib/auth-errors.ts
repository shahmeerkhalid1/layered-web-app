type AuthClientError = {
  message?: string;
  status?: number;
};

export function formatAuthRequestError(
  error: AuthClientError | null | undefined,
  fallback: string
): string {
  if (!error) return fallback;
  if (error.status === 429) {
    return "Too many attempts. Please wait a few minutes before trying again.";
  }
  return error.message ?? fallback;
}
