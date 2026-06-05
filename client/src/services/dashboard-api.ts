import { api } from "@/lib/api";
import type {
  DashboardNotificationsResponse,
  DashboardStats,
} from "@/lib/types";

export const dashboardApi = {
  getStats: (signal?: AbortSignal) =>
    api.get<DashboardStats>("/dashboard/stats", { signal }),

  getNotifications: (signal?: AbortSignal) =>
    api.get<DashboardNotificationsResponse>("/dashboard/notifications", { signal }),
};
