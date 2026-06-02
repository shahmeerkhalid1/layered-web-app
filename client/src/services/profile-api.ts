import { api } from "@/lib/api";

export const profileApi = {
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post<{ url: string }>("/profile/avatar", formData);
  },
  deleteAvatar: () => api.delete<void>("/profile/avatar"),
};
