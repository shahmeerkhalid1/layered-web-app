"use client";

import { useCallback, useEffect, useState } from "react";
import { subscriptionApi } from "@/services/subscription-api";
import type { SubscriptionStatus } from "@/lib/types";

function isQuotaReached(
  status: SubscriptionStatus | null,
  countKey: "classPlanCount" | "exerciseCount" | "clientCount",
  limitKey: "classPlanLimit" | "exerciseLimit" | "clientLimit"
): boolean {
  if (!status) return false;
  const limit = status[limitKey];
  if (limit == null) return false;
  return status[countKey] >= limit;
}

export function useSubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await subscriptionApi.getStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscription");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await subscriptionApi.getStatus(controller.signal);
          setStatus(data);
        } catch (err) {
          if (controller.signal.aborted) return;
          setError(err instanceof Error ? err.message : "Failed to load subscription");
          setStatus(null);
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      })();
    }, 0);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, []);

  const quotaReached = isQuotaReached(status, "classPlanCount", "classPlanLimit");
  const exerciseQuotaReached = isQuotaReached(
    status,
    "exerciseCount",
    "exerciseLimit"
  );
  const clientQuotaReached = isQuotaReached(status, "clientCount", "clientLimit");

  return {
    status,
    loading,
    error,
    refresh,
    quotaReached,
    exerciseQuotaReached,
    clientQuotaReached,
    isPaid: status?.tier === "active",
  };
}
