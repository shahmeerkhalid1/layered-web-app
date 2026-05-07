import { api } from "@/lib/api";
import type { DropdownOptionRow } from "@/lib/types";

export const dropdownApi = {
  getOptions: (categoryKey: string, signal?: AbortSignal) =>
    api.get<DropdownOptionRow[]>(`/dropdowns/${encodeURIComponent(categoryKey)}`, {
      signal,
    }),

  addOption: (categoryKey: string, label: string) =>
    api.post<DropdownOptionRow>(
      `/dropdowns/${encodeURIComponent(categoryKey)}`,
      { label }
    ),

  deleteOption: (optionId: string) =>
    api.delete<void>(
      `/dropdowns/options/${encodeURIComponent(optionId)}`
    ),
};
