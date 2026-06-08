import { api } from "@/lib/api";

export type AdminStats = {
  totalInstructors: number;
  activeInstructors: number;
  bannedInstructors: number;
};

export type InvitationRow = {
  id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedBy?: { name: string; email: string };
};

export type InvitationsResponse = {
  invitations: InvitationRow[];
};

export type InviteResponse = {
  invitation: InvitationRow;
  inviteLink: string;
  emailSent?: boolean;
  emailError?: string;
};

export type PlatformSettings = {
  signupEnabled: boolean;
};

export const adminApi = {
  getStats: () => api.get<AdminStats>("/admin/stats"),
  getInvitations: () => api.get<InvitationsResponse>("/admin/invitations"),
  getSettings: () => api.get<PlatformSettings>("/admin/settings"),
  patchSettings: (body: { signupEnabled?: boolean }) =>
    api.patch<PlatformSettings>("/admin/settings", body),
  invite: (body: { email: string; role: "ADMIN" | "INSTRUCTOR" }) =>
    api.post<InviteResponse>("/admin/invite", body),
  revokeInvitation: (id: string) =>
    api.delete<{ invitation: InvitationRow }>(`/admin/invitations/${id}`),
};

export function buildInviteLink(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/register?token=${token}`;
  }
  return `/register?token=${token}`;
}
