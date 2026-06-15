import type { ExerciseImage } from "@/lib/types";

export type ExerciseFormImageItem =
  | { type: "saved"; data: ExerciseImage }
  | { type: "pending"; file: File; previewUrl: string };

export function exerciseFormImageKey(item: ExerciseFormImageItem): string {
  return item.type === "saved" ? item.data.id : item.previewUrl;
}

export function exerciseFormImageUrl(item: ExerciseFormImageItem): string {
  return item.type === "saved" ? item.data.url : item.previewUrl;
}

export function revokePendingImageUrls(items: ExerciseFormImageItem[]): void {
  for (const item of items) {
    if (item.type === "pending") {
      URL.revokeObjectURL(item.previewUrl);
    }
  }
}
