"use client";

import { useEffect, useState } from "react";
import { profileApi } from "@/services/profile-api";

function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

/** Resolve S3 storage keys to presigned URLs; pass through legacy/http URLs. */
export function useSignedAvatarUrl(image: string | null | undefined): string | null {
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = image?.trim();
    if (!trimmed) {
      const t = window.setTimeout(() => setResolved(null), 0);
      return () => window.clearTimeout(t);
    }

    if (isHttpUrl(trimmed)) {
      const t = window.setTimeout(() => setResolved(trimmed), 0);
      return () => window.clearTimeout(t);
    }

    let cancelled = false;
    profileApi
      .getAvatar()
      .then((result) => {
        if (!cancelled) setResolved(result.url);
      })
      .catch(() => {
        if (!cancelled) setResolved(null);
      });

    return () => {
      cancelled = true;
    };
  }, [image]);

  return resolved;
}
