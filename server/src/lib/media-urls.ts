import { getSignedReadUrl, isStorageKey } from "./storage";

type ExerciseImageRow = {
  id: string;
  exerciseId: string;
  url: string;
  publicId?: string | null;
  order: number;
};

type ExerciseWithImages = {
  images?: ExerciseImageRow[];
};

async function signImageRow(
  image: ExerciseImageRow
): Promise<ExerciseImageRow> {
  const key = image.publicId ?? (isStorageKey(image.url) ? image.url : null);
  if (!key) {
    return image;
  }
  const signedUrl = await getSignedReadUrl(key);
  return { ...image, url: signedUrl };
}

export async function signExerciseImages<T extends ExerciseWithImages>(
  exercise: T
): Promise<T> {
  if (!exercise.images?.length) {
    return exercise;
  }
  const images = await Promise.all(exercise.images.map(signImageRow));
  return { ...exercise, images };
}

export async function signExerciseListResult(result: unknown): Promise<unknown> {
  if (Array.isArray(result)) {
    return Promise.all(
      result.map((item) => signExerciseImages(item as ExerciseWithImages))
    );
  }
  if (
    result &&
    typeof result === "object" &&
    "exercises" in result &&
    Array.isArray((result as { exercises: unknown }).exercises)
  ) {
    const paginated = result as {
      exercises: ExerciseWithImages[];
      total: number;
      page: number;
      limit: number;
    };
    const exercises = await Promise.all(
      paginated.exercises.map(signExerciseImages)
    );
    return { ...paginated, exercises };
  }
  return signExerciseImages(result as ExerciseWithImages);
}

export async function signAvatarUrl(
  avatarUrl: string | null | undefined
): Promise<string | null> {
  if (!avatarUrl?.trim()) return null;
  if (isStorageKey(avatarUrl)) {
    return getSignedReadUrl(avatarUrl);
  }
  return avatarUrl;
}
