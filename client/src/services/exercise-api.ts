import { api } from "@/lib/api";
import type {
  Exercise,
  ExerciseFolder,
  ExerciseFoldersResponse,
  ExerciseImage,
  ProgressionChainItem,
} from "@/lib/types";

export type ExerciseListParams = {
  search?: string;
  /** Omit for all; real folder id; use `"none"` for exercises with no folder */
  folderId?: string;
  tag?: string;
  /** When true/false, maps to `savedToLibrary` query on the list API. */
  savedToLibrary?: boolean;
  /** When set on `GET /exercises`, response is paginated JSON instead of a bare array. */
  page?: number;
  /** When sent with `page`, caps page size server-side (max 100). */
  limit?: number;
};

/** Server returns this shape when `page` is present on `GET /exercises`. */
export type PaginatedExerciseList = {
  exercises: Exercise[];
  total: number;
  page: number;
  limit: number;
};

/** Default page size for library list requests (server default matches). */
export const EXERCISE_LIBRARY_PAGE_SIZE = 9;

export type ExerciseLayerInput = {
  content: string;
  order?: number;
  isFinisher?: boolean;
};

export type SaveExerciseBody = {
  name: string;
  description?: string | null;
  startingPosition?: string | null;
  orientation?: string | null;
  directionFaced?: string | null;
  movementType?: string | null;
  springs?: string | null;
  equipment?: string[];
  machineSetup?: string | null;
  transitionCues?: string | null;
  cueing?: string | null;
  spinalMovement?: string[];
  chainType?: string[];
  jointLoading?: string[];
  progressionNotes?: string | null;
  regressionNotes?: string | null;
  tags?: string[];
  folderId?: string | null;
  progressionOfId?: string | null;
  layers?: ExerciseLayerInput[];
  publicIds?: string[];
  /** Omit for default (true). Set false for exercises created inside a class plan. */
  savedToLibrary?: boolean;
};

export type TempUploadedImage = {
  publicId: string;
  url: string;
};

export const exerciseApi = {
  getExercises: (params?: ExerciseListParams, signal?: AbortSignal) =>
    api.get<Exercise[]>("/exercises", {
      params: exerciseListParamsToQuery(params),
      signal,
    }),

  /**
   * Paginated `GET /exercises`: always send `page` + `limit`.
   * The `/exercises` library page must use this (via `useExerciseList`), never `getExercises`.
   * Pickers use `getExercises` (no `page`) for a full array.
   */
  getExerciseListPage: (
    params: ExerciseListParams & { page: number },
    signal?: AbortSignal
  ) =>
    api.get<PaginatedExerciseList>("/exercises", {
      params: exerciseListParamsToQuery({
        ...params,
        limit: params.limit ?? EXERCISE_LIBRARY_PAGE_SIZE,
      }),
      signal,
    }),
  getExerciseById: (id: string, signal?: AbortSignal) =>
    api.get<Exercise>(`/exercises/${encodeURIComponent(id)}`, { signal }),
  createExercise: (body: SaveExerciseBody) =>
    api.post<Exercise>("/exercises", body),
  updateExercise: (id: string, body: Partial<SaveExerciseBody>) =>
    api.patch<Exercise>(`/exercises/${id}`, body),
  deleteExercise: (id: string) => api.delete<void>(`/exercises/${id}`),
  setProgression: (id: string, progressionOfId: string | null) =>
    api.patch<Exercise>(`/exercises/${id}/progression`, { progressionOfId }),
  getProgressionChain: (id: string) =>
    api.get<ProgressionChainItem[]>(`/exercises/${id}/progression-chain`),
  addImage: (id: string, image: FormData) =>
    api.post<ExerciseImage>(`/exercises/${id}/images`, image),
  deleteImage: (id: string, imageId: string) =>
    api.delete<void>(`/exercises/${id}/images/${imageId}`),
  reorderImages: (id: string, imageIds: string[]) =>
    api.patch<ExerciseImage[]>(`/exercises/${id}/images/reorder`, { imageIds }),
  getFolders: () => api.get<ExerciseFoldersResponse>("/exercise-folders"),
  createFolder: (body: { name: string }) =>
    api.post<ExerciseFolder>("/exercise-folders", body),
  updateFolder: (id: string, body: { name?: string }) =>
    api.patch<ExerciseFolder>(`/exercise-folders/${id}`, body),
  deleteFolder: (id: string) => api.delete<void>(`/exercise-folders/${id}`),

  uploadTempImages: (formData: FormData) =>
    api.post<{ images: TempUploadedImage[] }>("/uploads/temp", formData),
  deleteTempImage: (publicId: string) =>
    api.delete<void>(`/uploads/temp/${encodeURIComponent(publicId)}`),

  saveExerciseToLibrary: (id: string, body?: { folderId?: string | null }) =>
    api.patch<Exercise>(`/exercises/${encodeURIComponent(id)}/save-to-library`, body ?? {}),
};

function exerciseListParamsToQuery(
  params: ExerciseListParams | undefined
): Record<string, string> | undefined {
  if (!params) return undefined;
  const out: Record<string, string> = {};
  if (params.search) out.search = params.search;
  if (params.folderId) out.folderId = params.folderId;
  if (params.tag) out.tag = params.tag;
  if (params.savedToLibrary === true) out.savedToLibrary = "true";
  if (params.savedToLibrary === false) out.savedToLibrary = "false";
  if (params.page !== undefined) out.page = String(params.page);
  if (params.limit !== undefined) out.limit = String(params.limit);
  return Object.keys(out).length ? out : undefined;
}
