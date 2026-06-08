import { api } from "@/lib/api";

export type RequestPasswordResetBody = {
  email: string;
  redirectTo?: string;
};

export type RequestPasswordResetResponse = {
  message: string;
};

export const authApi = {
  requestPasswordReset(body: RequestPasswordResetBody) {
    return api.post<RequestPasswordResetResponse>("/password-reset/request", body);
  },
};
