import { api } from "@/lib/api";
import type { SubscriptionStatus } from "@/lib/types";

export type BillingInterval = "month" | "year";

export const subscriptionApi = {
  getStatus: (signal?: AbortSignal) =>
    api.get<SubscriptionStatus>("/subscriptions/status", { signal }),

  createCheckout: (interval: BillingInterval) =>
    api.post<{ url: string }>("/subscriptions/checkout", { interval }),

  createPortal: () => api.post<{ url: string }>("/subscriptions/portal"),
};
