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
  folderId?: string;
  tag?: string;
};

export type ExerciseLayerInput = {
  content: string;
  order?: number;
};

export type SaveExerciseBody = {
  name: string;
  description?: string | null;
  startingPosition?: string | null;
  orientation?: string | null;
  directionFaced?: string | null;
  movementType?: string | null;
  springs?: string | null;
  equipment?: string | null;
  machineSetup?: string | null;
  transitionCues?: string | null;
  cueing?: string | null;
  spinalMovement?: string[];
  chainType?: string | null;
  jointLoading?: string[];
  tags?: string[];
  folderId?: string | null;
  progressionOfId?: string | null;
  layers?: ExerciseLayerInput[];
  publicIds?: string[];
};

export type TempUploadedImage = {
  publicId: string;
  url: string;
};

export const exerciseApi = {
  getExercises: (params?: ExerciseListParams, signal?: AbortSignal) =>
    api.get<Exercise[]>("/exercises", { params, signal }),
  getExerciseById: (id: string) => api.get<Exercise>(`/exercises/${id}`),
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
};
