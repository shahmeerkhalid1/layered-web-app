import { api } from "@/lib/api";
import type {
  CalendarClassInstance,
  ClassInstanceDetail,
  ClassListResponse,
  CreateClassBody,
  QuickScheduleResponse,
  ScheduledClass,
  UpdateClassBody,
} from "@/lib/types";

export type QuickScheduleBody = {
  title?: string;
  type: "GROUP" | "PRIVATE";
  durationMinutes: number;
  date: string;
  time: string;
  templateId?: string;
};

export const schedulingApi = {
  quickSchedule: (body: QuickScheduleBody) =>
    api.post<QuickScheduleResponse>("/quick-schedule", body),

  listClassInstances: (
    start: string,
    end: string,
    params?: { status?: "SCHEDULED" | "COMPLETED" | "CANCELLED"; classId?: string },
    signal?: AbortSignal
  ) =>
    api.get<CalendarClassInstance[]>("/class-instances", {
      params: {
        start,
        end,
        ...(params?.status && { status: params.status }),
        ...(params?.classId && { classId: params.classId }),
      },
      signal,
    }),

  getClassInstanceById: (id: string, signal?: AbortSignal) =>
    api.get<ClassInstanceDetail>(`/class-instances/${encodeURIComponent(id)}`, { signal }),

  updateClassInstance: (
    id: string,
    body: { date?: string; time?: string; status?: "SCHEDULED" | "COMPLETED" | "CANCELLED" }
  ) => api.patch<ClassInstanceDetail>(`/class-instances/${encodeURIComponent(id)}`, body),

  deleteClassInstance: (id: string) =>
    api.delete<{ message: string }>(`/class-instances/${encodeURIComponent(id)}`),

  assignTemplate: (instanceId: string, templateId: string) =>
    api.post<ClassInstanceDetail>(
      `/class-instances/${encodeURIComponent(instanceId)}/assign-template`,
      { templateId }
    ),

  addInstanceSection: (instanceId: string, body: { name: string; order?: number }) =>
    api.post(`/class-instances/${encodeURIComponent(instanceId)}/sections`, body),

  updateInstanceSection: (
    instanceId: string,
    sectionId: string,
    body: { name?: string; order?: number }
  ) =>
    api.patch(
      `/class-instances/${encodeURIComponent(instanceId)}/sections/${encodeURIComponent(sectionId)}`,
      body
    ),

  deleteInstanceSection: (instanceId: string, sectionId: string) =>
    api.delete<{ message: string }>(
      `/class-instances/${encodeURIComponent(instanceId)}/sections/${encodeURIComponent(sectionId)}`
    ),

  addInstanceSectionExercise: (
    instanceId: string,
    sectionId: string,
    body: {
      exerciseId: string;
      order?: number;
      reps?: string;
      duration?: string;
      notes?: string;
    }
  ) =>
    api.post(
      `/class-instances/${encodeURIComponent(instanceId)}/sections/${encodeURIComponent(sectionId)}/exercises`,
      body
    ),

  updateInstanceSectionExercise: (
    instanceId: string,
    sectionId: string,
    pseId: string,
    body: {
      order?: number;
      reps?: string | null;
      duration?: string | null;
      notes?: string | null;
    }
  ) =>
    api.patch(
      `/class-instances/${encodeURIComponent(instanceId)}/sections/${encodeURIComponent(sectionId)}/exercises/${encodeURIComponent(pseId)}`,
      body
    ),

  removeInstanceSectionExercise: (instanceId: string, sectionId: string, pseId: string) =>
    api.delete<{ message: string }>(
      `/class-instances/${encodeURIComponent(instanceId)}/sections/${encodeURIComponent(sectionId)}/exercises/${encodeURIComponent(pseId)}`
    ),

  listClasses: (
    params?: {
      page?: number;
      limit?: number;
      type?: "GROUP" | "PRIVATE";
      startDate?: string;
      endDate?: string;
      upcoming?: boolean;
    },
    signal?: AbortSignal
  ) =>
    api.get<ClassListResponse>("/classes", {
      params: params
        ? {
            ...(params.page !== undefined && { page: String(params.page) }),
            ...(params.limit !== undefined && { limit: String(params.limit) }),
            ...(params.type && { type: params.type }),
            ...(params.startDate && { startDate: params.startDate }),
            ...(params.endDate && { endDate: params.endDate }),
            ...(params.upcoming === true && { upcoming: "true" }),
          }
        : undefined,
      signal,
    }),

  getClassById: (id: string, signal?: AbortSignal) =>
    api.get<ScheduledClass>(`/classes/${encodeURIComponent(id)}`, { signal }),

  createClass: (body: CreateClassBody) =>
    api.post<ScheduledClass>("/classes", body),

  updateClass: (id: string, body: UpdateClassBody) =>
    api.patch<ScheduledClass>(`/classes/${encodeURIComponent(id)}`, body),

  deleteClass: (id: string) =>
    api.delete<{ message: string }>(`/classes/${encodeURIComponent(id)}`),
};
