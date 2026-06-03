import { api } from "@/lib/api";
import type {
  SessionNote,
  SessionNoteTimelineResponse,
} from "@/lib/types";

export const SESSION_NOTE_TIMELINE_PAGE_SIZE = 20;

export type CreateSessionNoteBody = {
  clientId: string;
  content?: string;
  exerciseIds?: string[];
};

export type UpdateSessionNoteBody = {
  content?: string;
};

export type ClientNotesParams = {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
};

function clientNotesParamsToQuery(params?: ClientNotesParams): Record<string, string> {
  const q: Record<string, string> = {};
  if (params?.page !== undefined) q.page = String(params.page);
  if (params?.limit !== undefined) q.limit = String(params.limit);
  if (params?.startDate) q.startDate = params.startDate;
  if (params?.endDate) q.endDate = params.endDate;
  return q;
}

export const sessionNoteApi = {
  getInstanceNotes: (instanceId: string, signal?: AbortSignal) =>
    api.get<SessionNote[]>(
      `/class-instances/${encodeURIComponent(instanceId)}/notes`,
      { signal }
    ),

  getClientNotes: (clientId: string, params?: ClientNotesParams, signal?: AbortSignal) =>
    api.get<SessionNoteTimelineResponse>(
      `/clients/${encodeURIComponent(clientId)}/notes`,
      {
        params: clientNotesParamsToQuery({
          ...params,
          limit: params?.limit ?? SESSION_NOTE_TIMELINE_PAGE_SIZE,
        }),
        signal,
      }
    ),

  createNote: (instanceId: string, body: CreateSessionNoteBody) =>
    api.post<SessionNote>(
      `/class-instances/${encodeURIComponent(instanceId)}/notes`,
      body
    ),

  getNoteById: (noteId: string, signal?: AbortSignal) =>
    api.get<SessionNote>(`/session-notes/${encodeURIComponent(noteId)}`, { signal }),

  updateNote: (noteId: string, body: UpdateSessionNoteBody) =>
    api.patch<SessionNote>(`/session-notes/${encodeURIComponent(noteId)}`, body),

  deleteNote: (noteId: string) =>
    api.delete<{ message: string }>(`/session-notes/${encodeURIComponent(noteId)}`),

  attachExercises: (noteId: string, exerciseIds: string[]) =>
    api.post<SessionNote>(`/session-notes/${encodeURIComponent(noteId)}/exercises`, {
      exerciseIds,
    }),

  detachExercise: (noteId: string, exerciseId: string) =>
    api.delete<SessionNote>(
      `/session-notes/${encodeURIComponent(noteId)}/exercises/${encodeURIComponent(exerciseId)}`
    ),
};
