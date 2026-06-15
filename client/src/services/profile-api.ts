import { api } from "@/lib/api";

export const profileApi = {
  getAvatar: () => api.get<{ url: string | null }>("/profile/avatar"),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post<{ url: string; storageKey: string }>("/profile/avatar", formData);
  },
  deleteAvatar: () => api.delete<void>("/profile/avatar"),
};
