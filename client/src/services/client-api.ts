import { api } from "@/lib/api";
import type {
  AttendanceRow,
  Client,
  ClientDetail,
  ClientListResponse,
  DeleteClientsResponse,
  EnrollClientsResponse,
  EnrollmentRow,
  UnenrollClientsResponse,
} from "@/lib/types";

export const CLIENT_PAGE_SIZE = 20;

export type ClientListParams = {
  search?: string;
  page?: number;
  limit?: number;
};

export type SaveClientBody = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  injuries?: string;
  focusAreas?: string;
  goals?: string;
};

function clientListParamsToQuery(params?: ClientListParams): Record<string, string> {
  const q: Record<string, string> = {};
  if (params?.search) q.search = params.search;
  if (params?.page !== undefined) q.page = String(params.page);
  if (params?.limit !== undefined) q.limit = String(params.limit);
  return q;
}

export const clientApi = {
  listClients: (params?: ClientListParams, signal?: AbortSignal) =>
    api.get<ClientListResponse>("/clients", {
      params: clientListParamsToQuery({
        ...params,
        limit: params?.limit ?? CLIENT_PAGE_SIZE,
      }),
      signal,
    }),

  getClientById: (id: string, signal?: AbortSignal) =>
    api.get<ClientDetail>(`/clients/${encodeURIComponent(id)}`, { signal }),

  createClient: (body: SaveClientBody) => api.post<Client>("/clients", body),

  updateClient: (id: string, body: Partial<SaveClientBody>) =>
    api.patch<ClientDetail>(`/clients/${encodeURIComponent(id)}`, body),

  deleteClients: (clientIds: string[]) =>
    api.delete<DeleteClientsResponse>("/clients", { clientIds }),

  deleteClient: (id: string) =>
    api.delete<void>(`/clients/${encodeURIComponent(id)}`),

  getEnrollments: (classId: string, signal?: AbortSignal) =>
    api.get<EnrollmentRow[]>(
      `/classes/${encodeURIComponent(classId)}/enrollments`,
      { signal }
    ),

  enrollClients: (classId: string, clientIds: string[]) =>
    api.post<EnrollClientsResponse>(
      `/classes/${encodeURIComponent(classId)}/enrollments`,
      { clientIds }
    ),

  enrollClient: (classId: string, clientId: string) =>
    api
      .post<EnrollClientsResponse>(
        `/classes/${encodeURIComponent(classId)}/enrollments`,
        { clientIds: [clientId] }
      )
      .then((result) => result.enrollments[0]!),

  unenrollClients: (classId: string, enrollmentIds: string[]) =>
    api.delete<UnenrollClientsResponse>(
      `/classes/${encodeURIComponent(classId)}/enrollments`,
      { enrollmentIds }
    ),

  unenrollClient: (classId: string, enrollmentId: string) =>
    api.delete<UnenrollClientsResponse>(
      `/classes/${encodeURIComponent(classId)}/enrollments/${encodeURIComponent(enrollmentId)}`
    ),

  getAttendance: (instanceId: string, signal?: AbortSignal) =>
    api.get<AttendanceRow[]>(
      `/class-instances/${encodeURIComponent(instanceId)}/attendance`,
      { signal }
    ),

  markAttendance: (
    instanceId: string,
    attendance: { clientId: string; present: boolean }[]
  ) =>
    api.patch<AttendanceRow[]>(
      `/class-instances/${encodeURIComponent(instanceId)}/attendance`,
      { attendance }
    ),
};
