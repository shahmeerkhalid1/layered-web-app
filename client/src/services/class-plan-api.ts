import { api } from "@/lib/api";
import type {
  ClassPlanFolder,
  ClassPlanFoldersResponse,
  ClassPlanListResponse,
  ClassPlanTemplate,
  ClassPlanTemplateDetail,
  PlanSection,
  PlanSectionExerciseRow,
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
  classType?: string | null;
  classStyle?: string | null;
  durationMinutes?: number;
  folderId?: string | null;
  tags?: string[];
};

/** PATCH body — omit keys you do not want to change. `classType` / `classStyle` may be `null` to clear. */
export type UpdateClassPlanBody = Partial<CreateClassPlanBody>;

/** Default page size for class plan library list (server max is 100). */
export const CLASS_PLAN_LIBRARY_PAGE_SIZE = 9;

export const classPlanApi = {
  listClassPlans: (params?: ClassPlanListParams, signal?: AbortSignal) =>
    api.get<ClassPlanListResponse>("/class-plans", { params: toQueryParams(params), signal }),

  getClassPlanById: (id: string, signal?: AbortSignal) =>
    api.get<ClassPlanTemplateDetail>(`/class-plans/${encodeURIComponent(id)}`, {
      signal,
    }),

  createClassPlan: (body: CreateClassPlanBody) =>
    api.post<ClassPlanTemplate>("/class-plans", body),

  updateClassPlan: (id: string, body: UpdateClassPlanBody) =>
    api.patch<ClassPlanTemplateDetail>(`/class-plans/${encodeURIComponent(id)}`, body),

  deleteClassPlan: (id: string) =>
    api.delete<{ message: string }>(`/class-plans/${encodeURIComponent(id)}`),

  duplicateClassPlan: (id: string) =>
    api.post<ClassPlanTemplate>(`/class-plans/${encodeURIComponent(id)}/duplicate`),

  addSection: (templateId: string, body: { name: string; order?: number }) =>
    api.post<PlanSection>(
      `/class-plans/${encodeURIComponent(templateId)}/sections`,
      body
    ),

  updateSection: (
    templateId: string,
    sectionId: string,
    body: { name?: string; order?: number }
  ) =>
    api.patch<PlanSection>(
      `/class-plans/${encodeURIComponent(templateId)}/sections/${encodeURIComponent(sectionId)}`,
      body
    ),

  deleteSection: (templateId: string, sectionId: string) =>
    api.delete<{ message: string }>(
      `/class-plans/${encodeURIComponent(templateId)}/sections/${encodeURIComponent(sectionId)}`
    ),

  addExerciseToSection: (
    templateId: string,
    sectionId: string,
    body: {
      exerciseId: string;
      order?: number;
      reps?: string;
      duration?: string;
      notes?: string;
    }
  ) =>
    api.post<PlanSectionExerciseRow>(
      `/class-plans/${encodeURIComponent(templateId)}/sections/${encodeURIComponent(sectionId)}/exercises`,
      body
    ),

  updateSectionExercise: (
    templateId: string,
    sectionId: string,
    pseId: string,
    body: {
      order?: number;
      reps?: string | null;
      duration?: string | null;
      notes?: string | null;
    }
  ) =>
    api.patch<PlanSectionExerciseRow>(
      `/class-plans/${encodeURIComponent(templateId)}/sections/${encodeURIComponent(sectionId)}/exercises/${encodeURIComponent(pseId)}`,
      body
    ),

  removeSectionExercise: (templateId: string, sectionId: string, pseId: string) =>
    api.delete<{ message: string }>(
      `/class-plans/${encodeURIComponent(templateId)}/sections/${encodeURIComponent(sectionId)}/exercises/${encodeURIComponent(pseId)}`
    ),

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
