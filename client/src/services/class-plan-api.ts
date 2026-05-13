import { api } from "@/lib/api";
import type {
  ClassPlanFolder,
  ClassPlanFoldersResponse,
  ClassPlanListResponse,
  ClassPlanTemplate,
} from "@/lib/types";

export type ClassPlanListParams = {
  search?: string;
  folderId?: string;
  classType?: string;
  classStyle?: string;
  /** Comma-separated tag labels for `hasSome` filter */
  tags?: string;
  page?: number;
  limit?: number;
};

export type CreateClassPlanBody = {
  name: string;
  classType?: string;
  classStyle?: string;
  durationMinutes?: number;
  folderId?: string | null;
  tags?: string[];
};

export type UpdateClassPlanBody = Partial<CreateClassPlanBody>;

export const classPlanApi = {
  listClassPlans: (params?: ClassPlanListParams, signal?: AbortSignal) =>
    api.get<ClassPlanListResponse>("/class-plans", { params: toQueryParams(params), signal }),

  getClassPlanById: (id: string) =>
    api.get<ClassPlanTemplate>(`/class-plans/${encodeURIComponent(id)}`),

  createClassPlan: (body: CreateClassPlanBody) =>
    api.post<ClassPlanTemplate>("/class-plans", body),

  updateClassPlan: (id: string, body: UpdateClassPlanBody) =>
    api.patch<ClassPlanTemplate>(`/class-plans/${encodeURIComponent(id)}`, body),

  deleteClassPlan: (id: string) =>
    api.delete<{ message: string }>(`/class-plans/${encodeURIComponent(id)}`),

  duplicateClassPlan: (id: string) =>
    api.post<ClassPlanTemplate>(`/class-plans/${encodeURIComponent(id)}/duplicate`),

  getFolders: () => api.get<ClassPlanFoldersResponse>("/class-plan-folders"),

  createFolder: (body: { name: string }) =>
    api.post<ClassPlanFolder>("/class-plan-folders", body),

  updateFolder: (id: string, body: { name: string }) =>
    api.patch<ClassPlanFolder>(`/class-plan-folders/${encodeURIComponent(id)}`, body),

  deleteFolder: (id: string) =>
    api.delete<void>(`/class-plan-folders/${encodeURIComponent(id)}`),
};

function toQueryParams(
  params: ClassPlanListParams | undefined
): Record<string, string> | undefined {
  if (!params) return undefined;
  const out: Record<string, string> = {};
  if (params.search) out.search = params.search;
  if (params.folderId !== undefined && params.folderId !== "") {
    out.folderId = params.folderId;
  }
  if (params.classType) out.classType = params.classType;
  if (params.classStyle) out.classStyle = params.classStyle;
  if (params.tags) out.tags = params.tags;
  if (params.page !== undefined) out.page = String(params.page);
  if (params.limit !== undefined) out.limit = String(params.limit);
  return Object.keys(out).length ? out : undefined;
}
